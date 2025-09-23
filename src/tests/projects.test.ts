/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { POST as createProject, GET as listProjects } from '@/app/api/projects/route';
import { DELETE as deleteProject, PUT as updateProject } from '@/app/api/projects/[id]/route';
import { POST as registerHandler } from '@/app/api/register/route';

// Mock requireUser at the top level
jest.mock('@/lib/authValidate', () => ({
  requireUser: jest.fn(),
}));

// Import after mock
import { requireUser } from '@/lib/authValidate';

describe('Projects API Handlers', () => {
  let projectId: string;
  let testUserId: string;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    // create a test user
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
  });

  afterAll(async () => {
    // if exists, delete the test user
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    if (user) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  // create project
  test('should create a project', async () => {
    const req = new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    new Request('http://localhost/api/projects', { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title: 'Updated Project', 
        synopsis: 'new synopsis', 
        visibility: 'PUBLIC' 
      }),
    });
    const res = await updateProject(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Updated Project');
    expect(data.synopsis).toBe('new synopsis');
    expect(data.visibility).toBe('PUBLIC');
  });

  // delete project
  test('should delete a project', async () => {
    const req = new Request(`http://localhost/api/projects/${projectId}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res = await deleteProject(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});