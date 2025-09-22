import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authValidate';
import { projectUpdateSchema } from '@/lib/validators';
import { assertOwnsProject } from '@/lib/projectValidate';

// GET: get a specific project
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()
    // ensure the user owns the project
    await assertOwnsProject(id, user.id)

    // found
    const p = await prisma.project.findUnique({ where: { id } })
    return NextResponse.json(p)
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'no such project or wrong ownership' }, { status: 403 })
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
}

// PUT: update a specific project
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()
    // ensure the user owns the project
    await assertOwnsProject(id, user.id)

    // validate
    const body = await req.json()
    const parsed = projectUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    // update
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'no such project or wrong ownership' }, { status: 403 })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: delete a specific project
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const user = await requireUser()
    // ensure the user owns the project and project exists
    await assertOwnsProject(id, user.id)

    // delete
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // any error
    if (e.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'no such project or wrong ownership' }, { status: 403 })
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}