import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { chapterReorderSchema } from '@/lib/validators';
import { assertOwnsProject } from '@/lib/projectValidate';

// PUT: reorder chapters within a project
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const data = chapterReorderSchema.parse(await req.json());
    await assertOwnsProject(data.projectId, user.id);

    // make sure the provided IDs match
    const dbChapters = await prisma.chapter.findMany({
      where: { projectId: data.projectId },
      select: { id: true },
      orderBy: { index: 'asc' },
    });
    const dbSet = new Set(dbChapters.map(c => c.id));
    // if the sets don't match, return error
    if (dbSet.size !== data.orderedChapterIds.length ||
        data.orderedChapterIds.some(id => !dbSet.has(id))) {
      return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 });
    }

    // update each chapter's index
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < data.orderedChapterIds.length; i++) {
        await tx.chapter.update({ where: { id: data.orderedChapterIds[i] }, data: { index: i } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request', detail: String(e) }, { status: 400 });
  }
}
