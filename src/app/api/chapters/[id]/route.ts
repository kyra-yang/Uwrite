import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { chapterUpdateSchema } from '@/lib/validators';

// helper function: check if the user owns the chapter (via project)
async function assertOwnsChapter(chapterId: string, userId: string) {
  const ch = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { projectId: true, index: true, project: { select: { ownerId: true } } },
  });
  if (!ch || ch.project.ownerId !== userId) throw new Error('FORBIDDEN');
  return ch;
}

// GET: get  specific chapter by id
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnsChapter(params.id, user.id);
    // found
    const ch = await prisma.chapter.findUnique({ where: { id: params.id } });
    return NextResponse.json(ch);
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
}

// PUT: update a specific chapter by id
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnsChapter(params.id, user.id);
    const data = chapterUpdateSchema.parse(await req.json());

    // update
    const updated = await prisma.chapter.update({
      where: { id: params.id },
      data: {
        ...data
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}

// DELETE: delete a specific chapter by id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const ch = await assertOwnsChapter(params.id, user.id);

    // delete
    await prisma.$transaction(async (tx) => {
      await tx.chapter.delete({ where: { id: params.id } });
      await tx.chapter.updateMany({
        where: { projectId: ch.projectId, index: { gt: ch.index } },
        data: { index: { decrement: 1 } },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
