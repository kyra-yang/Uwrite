import { POST } from '@/app/api/register/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

describe('POST /api/register', () => {
  // given invalid input schmema
  test('should reject invalid input', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'bad', password: '123', name: '' }),
    });

    const res = (await POST(req)) as NextResponse;
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  // successful registration
  test('should create a new user successfully', async () => {
    const email = `user_${Date.now()}@example.com`;
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'Tester',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.email).toBe(email);
    expect(data.name).toBe('Tester');

    // clean database
    await prisma.user.delete({ where: { email } });
  });

  test('should fail if email already exists', async () => {
    const email = `dup_${Date.now()}@example.com`;

    // create a user
    await prisma.user.create({
      data: {
        email,
        passwordHash: 'dummyhash',
        name: 'DupUser',
      },
    });

    // register with the same email
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'DupUser',
      }),
    });

    const res = (await POST(req)) as NextResponse;
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe('Email already registered');

    // clean database
    await prisma.user.delete({ where: { email } });
  });
});
