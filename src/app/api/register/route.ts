import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// define the correct schema for registration
const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

// POST /api/register
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    // invalid schema of input
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input schema' },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // if user (email) already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // success: create the user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    // if some unknown error
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
