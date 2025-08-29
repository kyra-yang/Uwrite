import { prisma } from '@/lib/prisma';
import { POST as createProject, GET as listProjects } from '@/app/api/projects/route';
import { DELETE as deleteProject, PUT as updateProject } from '@/app/api/projects/[id]/route';

// mock requireUser: always return our test user
jest.mock('@/lib/authValidate', () => ({
  requireUser: async () => ({ id: 'test-user-id', email: 'test@example.com', name: 'Tester' }),
}))

describe('Projects API Handlers', () => {
  let projectId: string;

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
  });

  afterAll(async () => {
    // delete test user
    await prisma.user.delete({ where: { id: 'test-user-id' } });
  });

  // create project
  test('should create a project', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Project' }),
    });
    const res = await createProject(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Test Project');
    projectId = data.id;
  });

  // list projects
  test('should list projects', async () => {
    const req = new Request('http://localhost/api/projects', { method: 'GET' });
    const res = await listProjects();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.find((p: any) => p.id === projectId)).toBeTruthy();
  });

  // update project
  test('should update a project', async () => {
    const req = new Request(`http://localhost/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated Project', synopsis: 'new synopsis', visibility: 'PUBLIC' }),
    });
    const res = await updateProject(req, { params: Promise.resolve({ id: projectId }) })
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Updated Project');
    expect(data.synopsis).toBe('new synopsis');
    expect(data.visibility).toBe('PUBLIC');
  });

  // delete project
  test('should delete a project', async () => {
    const req = new Request(`http://localhost/api/projects/${projectId}`, { method: 'DELETE' });
    const res = await deleteProject(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
