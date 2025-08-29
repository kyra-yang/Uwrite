import { prisma } from '@/lib/prisma';
import { POST as createChapter, GET as listChapters } from '@/app/api/chapters/route';
import { DELETE as deleteChapter, PUT as updateChapter } from '@/app/api/chapters/[id]/route';
import { POST as createProject } from '@/app/api/projects/route';

// mock requireUser: always return our test user
jest.mock('@/lib/authValidate', () => ({
  requireUser: async () => ({ id: 'test-user-id', email: 'test@example.com', name: 'Tester' }),
}))

describe('Chapters API Handlers', () => {
  let projectId: string;
  let chapterId: string;

  beforeAll(async () => {
    // clean up in case previous tests failed
    await prisma.user.deleteMany({ where: { id: 'test-user-id' } }); 
    // create a test user
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        passwordHash: 'fake',
        name: 'Tester',
      },
    });

    // create a test project
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Project For Chapters' }),
    });
    const res = await createProject(req);
    const data = await res.json();
    projectId = data.id;
  });

  afterAll(async () => {
    // delete test chapters
    await prisma.chapter.deleteMany({
        where: { project: { ownerId: 'test-user-id' } },
    });

    // delete test projects
    await prisma.project.deleteMany({
        where: { ownerId: 'test-user-id' },
    });

    // delete test user
    await prisma.user.delete({
        where: { id: 'test-user-id' },
    });
  });

  // create chapter
  test('should create a chapter', async () => {
    const req = new Request('http://localhost/api/chapters', {
      method: 'POST',
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
    const req = new Request(`http://localhost/api/chapters?projectId=${projectId}`, { method: 'GET' });
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
    const req = new Request(`http://localhost/api/chapters/${chapterId}`, { method: 'DELETE' });
    const res = await deleteChapter(req, { params: Promise.resolve({ id: chapterId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
