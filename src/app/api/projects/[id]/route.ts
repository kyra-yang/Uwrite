import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { projectUpdateSchema } from '@/lib/validators';
import { assertOwnsProject } from '@/lib/projectValidate';

// GET: get a specific project
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnsProject(params.id, user.id);
    // find the target project
    const p = await prisma.project.findUnique({ where: { id: params.id } });
    return NextResponse.json(p);
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
}


// PUT: update a specific project
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnsProject(params.id, user.id);

    // validate input
    const body = await req.json();
    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // update
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    if (e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: delete a specific project
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnsProject(params.id, user.id);
    // delete
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
