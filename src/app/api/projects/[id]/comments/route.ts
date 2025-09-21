import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: get all comments for a specific project
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id: projectId, visibility: 'PUBLIC' }
    });
    // ensure project exists and public
    if (!project) return NextResponse.json({ error: 'project not existing' }, { status: 404 });

    // fetch
    const comments = await prisma.comment.findMany({
      where: { projectId, chapterId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    // any error
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// POST: create a new comment for a specific project
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ensure login
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'have not login' }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const userId = session.user.id;
  const { content } = await request.json();

  // if a empty comment
  if (!content?.trim()) {
    return NextResponse.json({ error: 'comment cannot be empty' }, { status: 400 });
  }

  try {
    // ensure project exists and public
    const project = await prisma.project.findUnique({
      where: { id: projectId, visibility: 'PUBLIC' }
    });
    if (!project) return NextResponse.json({ error: 'project not existing' }, { status: 404 });

    // create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    // any error
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}