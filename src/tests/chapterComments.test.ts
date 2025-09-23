/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { GET as getComments, POST as createComment } from '@/app/api/chapters/[id]/comments/route';
import { POST as registerHandler } from '@/app/api/register/route';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Mock getServerSession
jest.mock('next-auth');
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Mock next/headers to avoid Next.js context error
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

describe('Chapter Comment API', () => {
  let userId: string;
  let otherUserId: string;
  let publicChapterId: string;
  let privateChapterId: string;
  let publicProjectId: string;
  let privateProjectId: string;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const otherUserEmail = `other_${Date.now()}@example.com`;

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.comment.deleteMany({});
    });
  beforeAll(async () => {
    // Register two test users
    const testUserReq = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: 'Tester' }),
    });
    const testUserRes = await registerHandler(testUserReq);
    const testUserData = await testUserRes.json();
    userId = testUserData.id;

    const otherUserReq = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherUserEmail, password: testPassword, name: 'Other User' }),
    });
    const otherUserRes = await registerHandler(otherUserReq);
    const otherUserData = await otherUserRes.json();
    otherUserId = otherUserData.id;

    // Clean database
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({ where: { ownerId: { in: [userId, otherUserId] } } });

    // Create a public project
    const publicProject = await prisma.project.create({
      data: { title: 'Public Project', synopsis: 'public', visibility: 'PUBLIC', ownerId: userId },
    });
    publicProjectId = publicProject.id;

    // Create a private project
    const privateProject = await prisma.project.create({
      data: { title: 'Private Project', synopsis: 'private', visibility: 'PRIVATE', ownerId: userId },
    });
    privateProjectId = privateProject.id;

    // Create chapters
    const publicChapter = await prisma.chapter.create({
      data: { title: 'Public Chapter', index: 1, status: 'PUBLISHED', projectId: publicProjectId },
    });
    publicChapterId = publicChapter.id;

    const privateChapter = await prisma.chapter.create({
      data: { title: 'Private Chapter', index: 1, status: 'PUBLISHED', projectId: privateProjectId },
    });
    privateChapterId = privateChapter.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({ where: { id: { in: [publicProjectId, privateProjectId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET Chapter Comments', () => {
    test('should return all comments for public chapter', async () => {
      // create test comments
      await prisma.comment.create({ data: { content: 'First', userId, chapterId: publicChapterId, projectId: publicProjectId } });
      await prisma.comment.create({ data: { content: 'Second', userId: otherUserId, chapterId: publicChapterId, projectId: publicProjectId } });

      const req = new NextRequest(`http://localhost/api/chapters/${publicChapterId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: publicChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
      // newest comment first
      expect(data[0].content).toBe('Second');
      expect(data[0].user.name).toBe('Other User');
      expect(data[1].content).toBe('First');
      expect(data[1].user.name).toBe('Tester');
    });

    test('should return empty array if no comments', async () => {
      const req = new NextRequest(`http://localhost/api/chapters/${publicChapterId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: publicChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toHaveLength(0);
    });

    test('should return 404 for private chapter', async () => {
      const req = new NextRequest(`http://localhost/api/chapters/${privateChapterId}/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: privateChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });

    test('should return 404 for non-existent chapter', async () => {
      const req = new NextRequest(`http://localhost/api/chapters/nonexistent/comments`, { method: 'GET' });
      const res = await getComments(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('chapter not existing');
    });
  });

  describe('POST Chapter Comments', () => {
    test('should return 401 if user not logged in', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest(`http://localhost/api/chapters/${publicChapterId}/comments`, { method: 'POST', body: JSON.stringify({ content: 'Hello' }) });
      const res = await createComment(req, { params: Promise.resolve({ id: publicChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('have not login');
    });

    test('should return 400 for empty comment', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

      const req = new NextRequest(`http://localhost/api/chapters/${publicChapterId}/comments`, { method: 'POST', body: JSON.stringify({ content: '  ' }) });
      const res = await createComment(req, { params: Promise.resolve({ id: publicChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('comment cannot be empty');
    });

    test('should create a comment successfully', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

      const req = new NextRequest(`http://localhost/api/chapters/${publicChapterId}/comments`, { method: 'POST', body: JSON.stringify({ content: 'Test comment' }) });
      const res = await createComment(req, { params: Promise.resolve({ id: publicChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.content).toBe('Test comment');
      expect(data.user.id).toBe(userId);

      const commentInDb = await prisma.comment.findUnique({ where: { id: data.id } });
      expect(commentInDb).toBeTruthy();
      expect(commentInDb?.content).toBe('Test comment');
    });

    test('should return 404 for non-existent chapter', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

      const req = new NextRequest(`http://localhost/api/chapters/nonexistent/comments`, { method: 'POST', body: JSON.stringify({ content: 'Hello' }) });
      const res = await createComment(req, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('chapter not existing');
    });

    test('should return 404 if chapter belongs to private project', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

      const req = new NextRequest(`http://localhost/api/chapters/${privateChapterId}/comments`, { method: 'POST', body: JSON.stringify({ content: 'Hello' }) });
      const res = await createComment(req, { params: Promise.resolve({ id: privateChapterId }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('project not existing');
    });
  });
});
