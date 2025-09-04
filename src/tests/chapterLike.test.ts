import { prisma } from '@/lib/prisma';
import { POST as chapterLikeHandler } from '@/app/api/chapters/[id]/likes/route';
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

describe('Chapter Like API', () => {
  let userId: string;
  let otherUserId: string;
  let chapterId: string;
  let projectId: string;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const otherUserEmail = `other_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register test users
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

    // Clean up database
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({ where: { ownerId: { in: [userId, otherUserId] } } });

    // Create public project
    const project = await prisma.project.create({
      data: { title: 'Public Project', synopsis: 'test', visibility: 'PUBLIC', ownerId: userId },
    });
    projectId = project.id;

    // Create published chapter
    const chapter = await prisma.chapter.create({
      data: { title: 'Chapter 1', index: 1, status: 'PUBLISHED', projectId },
    });
    chapterId = chapter.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if user is not logged in', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/chapters/${chapterId}/like`, { method: 'POST' });
    const res = await chapterLikeHandler(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('have not login');
  });

  test('should like a chapter successfully', async () => {
    // Mock session for logged-in user
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

    const req = new NextRequest(`http://localhost/api/chapters/${chapterId}/like`, { method: 'POST' });
    const res = await chapterLikeHandler(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.liked).toBe(true);

    // Verify the like exists in database
    const likeInDb = await prisma.like.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });
    expect(likeInDb).toBeTruthy();
  });

  test('should unlike a chapter if already liked', async () => {
    // Ensure the chapter is already liked
    await prisma.like.deleteMany({ where: { userId, chapterId } });
    await prisma.like.create({ data: { userId, chapterId } });

    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

    const req = new NextRequest(`http://localhost/api/chapters/${chapterId}/like`, { method: 'POST' });
    const res = await chapterLikeHandler(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.liked).toBe(false);

    // Verify the like was removed from database
    const likeInDb = await prisma.like.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });
    expect(likeInDb).toBeNull();
  });

  test('should return 404 for non-existent chapter', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

    const fakeId = 'non-existent-id';
    const req = new NextRequest(`http://localhost/api/chapters/${fakeId}/like`, { method: 'POST' });
    const res = await chapterLikeHandler(req, { params: Promise.resolve({ id: fakeId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('chapter not existing');
  });

  test('should return 404 if chapter belongs to private project', async () => {
    // Create private project and chapter
    const privateProject = await prisma.project.create({
      data: { title: 'Private Project', synopsis: 'test', visibility: 'PRIVATE', ownerId: userId },
    });
    const privateChapter = await prisma.chapter.create({
      data: { title: 'Private Chapter', index: 1, status: 'PUBLISHED', projectId: privateProject.id },
    });

    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: testEmail } } as any);

    const req = new NextRequest(`http://localhost/api/chapters/${privateChapter.id}/like`, { method: 'POST' });
    const res = await chapterLikeHandler(req, { params: Promise.resolve({ id: privateChapter.id }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('project not existing');

    // Clean up private chapter and project
    await prisma.chapter.delete({ where: { id: privateChapter.id } });
    await prisma.project.delete({ where: { id: privateProject.id } });
  });
});
