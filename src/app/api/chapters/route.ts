import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { chapterCreateSchema } from '@/lib/validators';
import { assertOwnsProject } from '@/lib/projectValidate';

// POST: create a new chapter
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const data = chapterCreateSchema.parse(await req.json());
    await assertOwnsProject(data.projectId, user.id);

    // Get the current max index in the project
    const max = await prisma.chapter.aggregate({
      where: { projectId: data.projectId },
      _max: { index: true },
    });

    // Create the new chapter with index = max + 1
    const created = await prisma.chapter.create({
      data: {
        projectId: data.projectId,
        index: (max._max.index ?? -1) + 1,
        title: data.title,
        // content for rich text editor
        contentJson: data.contentJson ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request', detail: String(e) }, { status: 400 });
  }
}

// GET: get the list of chapters for a project
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || '';
    await assertOwnsProject(projectId, user.id);
    // Get chapters ordered by index
    const chapters = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: { index: 'asc' },
    });
    return NextResponse.json({ items: chapters });
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
