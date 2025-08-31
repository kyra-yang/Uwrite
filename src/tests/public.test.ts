import { prisma } from '@/lib/prisma';
import { GET as getPublicProjects } from '@/app/api/public/route';
import { GET as getPublicProject } from '@/app/api/public/[id]/route';

// mock requireUser: always return our test user
jest.mock('@/lib/authValidate', () => ({
  requireUser: async () => ({ id: 'test-user-id', email: 'test@example.com', name: 'Tester' }),
}));

describe('Public Features API Handlers', () => {
  let userId: string;
  let publicProjectId: string;
  let privateProjectId: string;
  let publishedChapterId: string;
  let draftChapterId: string;

  beforeAll(async () => {
    // create a test user
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        passwordHash: 'fake',
        name: 'Tester',
      },
    });
    userId = 'test-user-id';

    // create a public project with chapters
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

    // create chapters for public project
    const publishedChapter = await prisma.chapter.create({
      data: {
        title: 'Published Chapter',
        index: 1,
        status: 'PUBLISHED',
        contentHtml: '<p>This is published content</p>',
        contentText: 'This is published content',
        projectId: publicProjectId,
      },
    });
    publishedChapterId = publishedChapter.id;

    const draftChapter = await prisma.chapter.create({
      data: {
        title: 'Draft Chapter',
        index: 2,
        status: 'DRAFT',
        contentHtml: '<p>This is draft content</p>',
        contentText: 'This is draft content',
        projectId: publicProjectId,
      },
    });
    draftChapterId = draftChapter.id;
  });

  afterAll(async () => {
    // cleanup: delete test data
    await prisma.chapter.deleteMany({ where: { projectId: { in: [publicProjectId, privateProjectId] } } });
    await prisma.project.deleteMany({ where: { id: { in: [publicProjectId, privateProjectId] } } });
    await prisma.user.delete({ where: { id: userId } });
  });

  // test getting all public projects
  test('should get all public projects', async () => {
    const res = await getPublicProjects();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // should include our public project
    const foundProject = data.find((p: any) => p.id === publicProjectId);
    expect(foundProject).toBeTruthy();
    expect(foundProject.title).toBe('Public Test Story');
    expect(foundProject.owner.name).toBe('Tester');
    expect(foundProject._count.chapters).toBe(2); // total chapters
    expect(foundProject.chapters).toHaveLength(1); // only published chapters returned
    expect(foundProject.chapters[0].status).toBe('PUBLISHED');

    // should NOT include private project
    const privateFound = data.find((p: any) => p.id === privateProjectId);
    expect(privateFound).toBeFalsy();
  });

  // test getting specific public project
  test('should get specific public project with published chapters only', async () => {
    const req = new Request(`http://localhost/api/public/${publicProjectId}`, { method: 'GET' });
    const res = await getPublicProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe(publicProjectId);
    expect(data.title).toBe('Public Test Story');
    expect(data.owner.name).toBe('Tester');
    expect(data._count.chapters).toBe(2); // total chapters
    expect(data.chapters).toHaveLength(1); // only published chapters
    expect(data.chapters[0].title).toBe('Published Chapter');
    expect(data.chapters[0].status).toBe('PUBLISHED');
  });

  // test getting private project should return 404
  test('should return 404 for private project', async () => {
    const req = new Request(`http://localhost/api/public/${privateProjectId}`, { method: 'GET' });
    const res = await getPublicProject(req, { params: Promise.resolve({ id: privateProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Project not found or not public');
  });

  // test getting non-existent project
  test('should return 404 for non-existent project', async () => {
    const fakeId = 'non-existent-id';
    const req = new Request(`http://localhost/api/public/${fakeId}`, { method: 'GET' });
    const res = await getPublicProject(req, { params: Promise.resolve({ id: fakeId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Project not found or not public');
  });

  // test that draft chapters are not included in public view
  test('should not include draft chapters in public project', async () => {
    const req = new Request(`http://localhost/api/public/${publicProjectId}`, { method: 'GET' });
    const res = await getPublicProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    
    // should only have published chapters
    expect(data.chapters).toHaveLength(1);
    expect(data.chapters[0].title).toBe('Published Chapter');
    
    // should not include the draft chapter
    const hasDraftChapter = data.chapters.some((ch: any) => ch.title === 'Draft Chapter');
    expect(hasDraftChapter).toBe(false);
  });

  // test chapters are ordered by index
  test('should return chapters ordered by index', async () => {
    // create another published chapter with higher index
    const chapter3 = await prisma.chapter.create({
      data: {
        title: 'Another Published Chapter',
        index: 3,
        status: 'PUBLISHED',
        contentHtml: '<p>More content</p>',
        contentText: 'More content',
        projectId: publicProjectId,
      },
    });

    const req = new Request(`http://localhost/api/public/${publicProjectId}`, { method: 'GET' });
    const res = await getPublicProject(req, { params: Promise.resolve({ id: publicProjectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.chapters).toHaveLength(2);
    
    // should be ordered by index
    expect(data.chapters[0].index).toBe(1);
    expect(data.chapters[1].index).toBe(3);
    expect(data.chapters[0].title).toBe('Published Chapter');
    expect(data.chapters[1].title).toBe('Another Published Chapter');

    // cleanup
    await prisma.chapter.delete({ where: { id: chapter3.id } });
  });
});