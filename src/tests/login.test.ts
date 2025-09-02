import { prisma } from '@/lib/prisma';
import { POST as registerHandler } from '@/app/api/register/route';
import bcrypt from 'bcryptjs';

describe('Login Authentication', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testName = 'Test User';
  let testUserId: string;

  // register a test user
  beforeAll(async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
    });

    const res = await registerHandler(req);
    const data = await res.json();
    testUserId = data.id;
  });

  // clear the database
  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } });
  });

  const authenticateCredentials = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  };

  // succecss login
  test('should login successfully with correct credentials', async () => {
    const result = await authenticateCredentials(testEmail, testPassword);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(testUserId);
    expect(result?.email).toBe(testEmail);
    expect(result?.name).toBe(testName);
  });

  // fail: wrong password
  test('should fail login with wrong password', async () => {
    const result = await authenticateCredentials(testEmail, 'wrongpassword');
    expect(result).toBeNull();
  });

  // fail: no exist user
  test('should fail login with non-existent email', async () => {
    const result = await authenticateCredentials('nonexistent@example.com', testPassword);
    expect(result).toBeNull();
  });
});