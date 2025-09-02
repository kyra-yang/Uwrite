import { prisma } from '@/lib/prisma';
import { GET as getComments, POST as createComment } from '@/app/api/projects/[id]/comments/route';
import { POST as registerHandler } from '@/app/api/register/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Mock getServerSession
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Mock next/headers to avoid the Next.js context error
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
  })),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
  })),
}));

describe('Comment API Handlers', () => {
  let userId: string;
  let otherUserId: string;
  let publicProjectId: string;
  let privateProjectId: string;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const otherUserEmail = `other_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Create test users using register endpoint
    const testUserReq = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Tester',
      }),
    });

    const testUserRes = await registerHandler(testUserReq);
    const testUserData = await testUserRes.json();
    userId = testUserData.id;

    const otherUserReq = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: otherUserEmail,
        password: testPassword,
        name: 'Other User',
      }),
    });

    const otherUserRes = await registerHandler(otherUserReq);
    const otherUserData = await otherUserRes.json();
    otherUserId = otherUserData.id;

    // Clean up in correct order (child records first)
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({ where: { ownerId: { in: [userId, otherUserId] } } });

    // create a public project
    const publicProject = await prisma.project.create({
      data: {
        title: 'Public Test Story',
        synopsis: 'A test story for public viewing',
        visibility: 'PUBLIC',
        ownerId: userId,
      },
    });
    publicProjectId = publicProject.id;

    // create a private project
    const privateProject = await prisma.project.create({
      data: {
        title: 'Private Test Story',
        synopsis: 'A private story',
        visibility: 'PRIVATE',
        ownerId: userId,
      },
    });
    privateProjectId = privateProject.id;
  });

  afterAll(async () => {
    // cleanup in correct order: child records first, then parent records
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    if (publicProjectId && privateProjectId) {
      await prisma.project.deleteMany({ 
        where: { id: { in: [publicProjectId, privateProjectId] } } 
      });
    }
    if (userId && otherUserId) {
      await prisma.user.deleteMany({ 
        where: { id: { in: [userId, otherUserId] } } 
      });
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean up any comments before each test to ensure clean state
    await prisma.comment.deleteMany({ where: { projectId: publicProjectId } });
  });

  describe('GET Comments', () => {
    // test getting comments for public project
    test('should get all comments for public project', async () => {
      // Create some test comments
      const comment1 = await prisma.comment.create({
        data: {
          content: 'First comment',
          userId,
          projectId: publicProjectId,
        },
      });

      const comment2 = await prisma.comment.create({
        data: {
          content: 'Second comment',
          userId: otherUserId,
          projectId: publicProjectId,
        },
      });

      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      
      // Comments should be ordered by createdAt desc, so comment2 should be first
      expect(data[0].content).toBe('Second comment');
      expect(data[0].user.name).toBe('Other User');
      expect(data[1].content).toBe('First comment');
      expect(data[1].user.name).toBe('Tester');
    });

    test('should return empty array for project with no comments', async () => {
      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test('should return 404 for private project', async () => {
      const req = new NextRequest(`http://localhost/api/projects/${privateProjectId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: privateProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });

    test('should return 404 for non-existent project', async () => {
      const fakeId = 'non-existent-id';
      const req = new NextRequest(`http://localhost/api/projects/${fakeId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: fakeId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });
  });

  describe('POST Comments', () => {
    // test authentication required
    test('should return 401 when user is not logged in', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('have not login');
    });

    test('should return 401 when session exists but no user', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('have not login');
    });

    // test comment validation
    test('should return 400 for empty comment', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('comment cannot be empty');
    });

    test('should return 400 for whitespace-only comment', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: '   \n\t   ' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('comment cannot be empty');
    });

    // test project validation
    test('should return 404 for non-existent project', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const fakeId = 'non-existent-id';
      const req = new NextRequest(`http://localhost/api/projects/${fakeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: fakeId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });

    test('should return 404 for private project', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const req = new NextRequest(`http://localhost/api/projects/${privateProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: privateProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });

    // test successful comment creation
    test('should create a comment successfully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const commentContent = 'This is a test comment';
      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentContent }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.content).toBe(commentContent);
      expect(data.userId).toBe(userId);
      expect(data.projectId).toBe(publicProjectId);
      expect(data.user.name).toBe('Tester');
      expect(data.user.email).toBe(testEmail);

      // verify comment was created in database
      const commentInDb = await prisma.comment.findUnique({
        where: { id: data.id }
      });
      expect(commentInDb).toBeTruthy();
      expect(commentInDb?.content).toBe(commentContent);
    });

    test('should trim whitespace from comment content', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const commentContent = '  This comment has whitespace  ';
      const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentContent }),
      });
      const res = await createComment(req, { params: Promise.resolve({ id: publicProjectId }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.content).toBe('This comment has whitespace');
    });

    // test multiple comments
    test('should allow multiple users to comment on the same project', async () => {
      // User 1 comments
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const req1 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'First user comment' }),
      });
      const res1 = await createComment(req1, { params: Promise.resolve({ id: publicProjectId }) });
      const data1 = await res1.json();
      expect(res1.status).toBe(201);
      expect(data1.user.name).toBe('Tester');

      // User 2 comments
      mockGetServerSession.mockResolvedValue({
        user: { id: otherUserId, email: otherUserEmail }
      } as any);

      const req2 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Second user comment' }),
      });
      const res2 = await createComment(req2, { params: Promise.resolve({ id: publicProjectId }) });
      const data2 = await res2.json();
      expect(res2.status).toBe(201);
      expect(data2.user.name).toBe('Other User');

      // verify both comments exist in database
      const commentsInDb = await prisma.comment.findMany({
        where: { projectId: publicProjectId }
      });
      expect(commentsInDb).toHaveLength(2);
    });

    test('should allow same user to create multiple comments', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      // First comment
      const req1 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'First comment' }),
      });
      const res1 = await createComment(req1, { params: Promise.resolve({ id: publicProjectId }) });
      expect(res1.status).toBe(201);

      // Second comment
      const req2 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Second comment' }),
      });
      const res2 = await createComment(req2, { params: Promise.resolve({ id: publicProjectId }) });
      expect(res2.status).toBe(201);

      // verify both comments exist
      const commentsInDb = await prisma.comment.findMany({
        where: { projectId: publicProjectId, userId }
      });
      expect(commentsInDb).toHaveLength(2);
    });

    // test error handling
    test('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      // use invalid project ID to trigger database error
      const invalidId = 'invalid-uuid-format';
      const req = new NextRequest(`http://localhost/api/projects/${invalidId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });
      
      const res = await createComment(req, { params: Promise.resolve({ id: invalidId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });
  });

  describe('GET and POST Integration', () => {
    test('should retrieve comments after creating them', async () => {
      // Create a comment first
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      const createReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Integration test comment' }),
      });
      const createRes = await createComment(createReq, { params: Promise.resolve({ id: publicProjectId }) });
      expect(createRes.status).toBe(201);

      // Then retrieve all comments
      const getReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, { method: 'GET' });
      const getRes = await getComments(getReq, { params: Promise.resolve({ id: publicProjectId }) });
      const comments = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('Integration test comment');
      expect(comments[0].user.name).toBe('Tester');
    });

    test('should return comments in correct order (newest first)', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: userId, email: testEmail }
      } as any);

      // Create first comment
      const req1 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Older comment' }),
      });
      await createComment(req1, { params: Promise.resolve({ id: publicProjectId }) });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second comment
      const req2 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Newer comment' }),
      });
      await createComment(req2, { params: Promise.resolve({ id: publicProjectId }) });

      // Get comments
      const getReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/comments`, { method: 'GET' });
      const getRes = await getComments(getReq, { params: Promise.resolve({ id: publicProjectId }) });
      const comments = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(comments).toHaveLength(2);
      // Newest comment should be first (desc order)
      expect(comments[0].content).toBe('Newer comment');
      expect(comments[1].content).toBe('Older comment');
    });
  });
});