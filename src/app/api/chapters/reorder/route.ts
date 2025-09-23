/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { chapterReorderSchema } from '@/lib/validators';
import { assertOwnsProject } from '@/lib/projectValidate';

// PUT: Reorder chapters within a project
export async function PUT(req: Request) {
  try {
    // Ensure logged in
    const user = await requireUser();
    const body = await req.json();
    const data = chapterReorderSchema.parse(body);

    // Ensure the user owns the project
    await assertOwnsProject(data.projectId, user.id);

    // Reorder chapters in a transaction
    await prisma.$transaction(
      data.orderedChapterIds.map((id, idx) =>
        prisma.chapter.update({
          where: { id },
          data: { index: idx },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // any errors
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
