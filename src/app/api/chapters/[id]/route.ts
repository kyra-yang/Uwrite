/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { chapterUpdateSchema } from '@/lib/validators';
import { htmlToPlainText, jsonToHtml } from '@/lib/content';

// helper function: check if the user owns the chapter (via project)
async function assertOwnsChapter(chapterId: string, userId: string) {
  const ch = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { projectId: true, index: true, project: { select: { ownerId: true } } },
  });
  if (!ch || ch.project.ownerId !== userId) throw new Error('FORBIDDEN');
  return ch;
}

// GET: get specific chapter by id
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    // ensure logged in
    const user = await requireUser()
    // ensure owns the chapter
    await assertOwnsChapter(id, user.id)

    // found
    const ch = await prisma.chapter.findUnique({ where: { id } })
    return NextResponse.json(ch)
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'wrong ownership' }, { status: 403 })
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
}

// PUT: update a specific chapter by id
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    // ensure logged in
    const user = await requireUser()
    // ensure owns the chapter
    await assertOwnsChapter(id, user.id)

    const body = await req.json()
    const data = chapterUpdateSchema.parse(body)

    // convert contentJson to contentHtml and contentText
    let contentHtml: string | undefined
    let contentText: string | undefined
    if (data.contentJson) {
      contentHtml = jsonToHtml(data.contentJson)
      contentText = htmlToPlainText(contentHtml)
    }

    // update
    const updated = await prisma.chapter.update({
      where: { id },
      data: {
        ...data,
        contentHtml,
        contentText,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'ownership wrong' }, { status: 403 })
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

// DELETE: delete a specific chapter by id
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    // ensure logged in
    const user = await requireUser()
    // ensure owns the chapter
    const ch = await assertOwnsChapter(id, user.id)

    // delete and reorder indexes in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.chapter.delete({ where: { id } })
      await tx.chapter.updateMany({
        where: { projectId: ch.projectId, index: { gt: ch.index } },
        data: { index: { decrement: 1 } },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'ownership wrong' }, { status: 403 })
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}