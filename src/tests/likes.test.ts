import { prisma } from '@/lib/prisma';
import { POST as likeProject } from '@/app/api/projects/[id]/likes/route';
import { POST as registerHandler } from '@/app/api/register/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Mock getServerSession
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Like Project API Handler', () => {
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

    // Clean up in the correct order
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({});

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
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clean up any likes before each test to ensure clean state
    await prisma.like.deleteMany({});
    
    // Verify test data still exists before each test
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    const projectExists = await prisma.project.findUnique({ where: { id: publicProjectId } });
    
    if (!userExists || !projectExists) {
      throw new Error('Test data was unexpectedly deleted');
    }
  });

  // test authentication required
  test('should return 401 when user is not logged in', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('have not login');
  });

  test('should return 401 when session exists but no user', async () => {
    mockGetServerSession.mockResolvedValue({ user: null } as any);

    const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('have not login');
  });

  // test project validation
  test('should return 404 for non-existent project', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    const fakeId = 'non-existent-id';
    const req = new NextRequest(`http://localhost/api/projects/${fakeId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: fakeId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('project not existing');
  });

  test('should return 404 for private project', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    const req = new NextRequest(`http://localhost/api/projects/${privateProjectId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: privateProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('project not existing');
  });

  // test like functionality
  test('should create a like when user has not liked the project', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    const projectCheck = await prisma.project.findUnique({
      where: { id: publicProjectId }
    });

    const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.liked).toBe(true);

    // verify like was created in database
    const likeInDb = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: publicProjectId } }
    });
    expect(likeInDb).toBeTruthy();
  });

  test('should remove like when user has already liked the project', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    // First, create a like through the API to ensure proper state
    const createReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const createRes = await likeProject(createReq, { params: Promise.resolve({ id: publicProjectId }) });
    expect(createRes.status).toBe(200);
    
    const createData = await createRes.json();
    expect(createData.liked).toBe(true);

    // Now unlike it
    const unlikeReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const unlikeRes = await likeProject(unlikeReq, { params: Promise.resolve({ id: publicProjectId }) });
    const unlikeData = await unlikeRes.json();

    expect(unlikeRes.status).toBe(200);
    expect(unlikeData.liked).toBe(false);

    // verify like was removed from database
    const likeInDb = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: publicProjectId } }
    });
    expect(likeInDb).toBeNull();
  });

  // test toggle behavior
  test('should handle like -> unlike -> like sequence', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    
    // First like
    const res1 = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.liked).toBe(true);

    // Unlike
    const res2 = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.liked).toBe(false);

    // Like again
    const res3 = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data3 = await res3.json();
    expect(res3.status).toBe(200);
    expect(data3.liked).toBe(true);
  });

  // test multiple users can like the same project
  test('should allow multiple users to like the same project', async () => {
    // User 1 likes project
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    const req1 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res1 = await likeProject(req1, { params: Promise.resolve({ id: publicProjectId }) });
    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.liked).toBe(true);

    // User 2 likes same project
    mockGetServerSession.mockResolvedValue({
      user: { id: otherUserId, email: otherUserEmail }
    } as any);

    const req2 = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res2 = await likeProject(req2, { params: Promise.resolve({ id: publicProjectId }) });
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.liked).toBe(true);

    // verify both likes exist in database
    const user1Like = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: publicProjectId } }
    });
    const user2Like = await prisma.like.findUnique({
      where: { userId_projectId: { userId: otherUserId, projectId: publicProjectId } }
    });

    expect(user1Like).toBeTruthy();
    expect(user2Like).toBeTruthy();
  });

  // test user can only like each project once
  test('should prevent duplicate likes', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    // Create initial like through API
    const createReq = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const createRes = await likeProject(createReq, { params: Promise.resolve({ id: publicProjectId }) });
    expect(createRes.status).toBe(200);
    
    const createData = await createRes.json();
    expect(createData.liked).toBe(true);

    // try to like again (should unlike)
    const req = new NextRequest(`http://localhost/api/projects/${publicProjectId}/likes`, { method: 'POST' });
    const res = await likeProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.liked).toBe(false);

    // verify like was removed
    const likeInDb = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId: publicProjectId } }
    });
    expect(likeInDb).toBeNull();
  });

  // test error handling
  test('should handle database errors gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: testEmail }
    } as any);

    // use invalid project ID to trigger database error
    const invalidId = 'invalid-uuid-format';
    const req = new NextRequest(`http://localhost/api/projects/${invalidId}/likes`, { method: 'POST' });
    
    const res = await likeProject(req, { params: Promise.resolve({ id: invalidId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('project not existing');
  });
});