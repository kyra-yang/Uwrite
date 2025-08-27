import { prisma } from '@/lib/prisma';
import { POST as createProject, GET as listProjects } from '@/app/api/projects/route';
import { DELETE as deleteProject } from '@/app/api/projects/[id]/route';

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

  // delete project
  test('should delete a project', async () => {
    const req = new Request(`http://localhost/api/projects/${projectId}`, { method: 'DELETE' });
    const res = await deleteProject(req, { params: { id: projectId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
