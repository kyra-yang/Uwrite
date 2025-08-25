import { prisma } from '@/lib/prisma';
import { authorizeCredentials } from '@/lib/auth';
import bcrypt from 'bcryptjs';

describe('Credentials authorize()', () => {
  const email = `auth_${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, name: 'AuthTester' },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email } });
  });

  test('should login with correct credentials', async () => {
    const user = await authorizeCredentials({ email, password });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(email);
  });

  test('should fail with wrong password', async () => {
    const user = await authorizeCredentials({ email, password: 'wrong' });
    expect(user).toBeNull();
  });
});