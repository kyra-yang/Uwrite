/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { POST as createChapter, GET as listChapters } from '@/app/api/chapters/route';
import { DELETE as deleteChapter, PUT as updateChapter } from '@/app/api/chapters/[id]/route';
import { POST as createProject } from '@/app/api/projects/route';
import { POST as registerHandler } from '@/app/api/register/route';

// Mock requireUser at the top level
jest.mock('@/lib/authValidate', () => ({
  requireUser: jest.fn(),
}));

// Import after mock
import { requireUser } from '@/lib/authValidate';

describe('Chapters API Handlers', () => {
  let projectId: string;
  let chapterId: string;
  let testUserId: string;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    // Create test user using register endpoint
    const registerReq = new Request('http://localhost/api/register', {
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

    const registerRes = await registerHandler(registerReq);
    const userData = await registerRes.json();
    testUserId = userData.id;

    // Setup mock implementation
    (requireUser as jest.Mock).mockResolvedValue({ 
      id: testUserId, 
      email: testEmail, 
      name: 'Tester' 
    });

    // create a test project
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Project For Chapters' }),
    });
    const res = await createProject(req);
    const data = await res.json();
    projectId = data.id;
  });

  afterAll(async () => {
    // delete test chapters
    await prisma.chapter.deleteMany({
        where: { project: { ownerId: testUserId } },
    });

    // delete test projects
    await prisma.project.deleteMany({
        where: { ownerId: testUserId },
    });

    // delete test user
    await prisma.user.delete({
        where: { id: testUserId },
    });
  });

  // create chapter
  test('should create a chapter', async () => {
    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, title: 'First Chapter' }),
    });
    const res = await createChapter(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('First Chapter');
    chapterId = data.id;
  });

  // list chapters
  test('should list chapters', async () => {
    const req = new Request(`http://localhost/api/chapters?projectId=${projectId}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await listChapters(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.find((c: any) => c.id === chapterId)).toBeTruthy();
  });

  // update chapter
  test('should update a chapter', async () => {
    const req = new Request(`http://localhost/api/chapters/${chapterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Chapter',
        contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello!' }] }] },
        status: 'PUBLISHED',
      }),
    });
    const res = await updateChapter(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Updated Chapter');
    expect(data.status).toBe('PUBLISHED');
    expect(data.contentHtml).toMatch(/<p.*?>/)
    expect(data.contentHtml).toContain('Hello!')
  });
  
  // delete chapter
  test('should delete a chapter', async () => {
    const req = new Request(`http://localhost/api/chapters/${chapterId}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await deleteChapter(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
