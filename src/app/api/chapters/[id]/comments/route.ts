import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: get all comments for specific chapters
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await ctx.params;

    // ensure chapter exists and published
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId, status: "PUBLISHED" },
      include: { project: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: 'chapter not existing' }, { status: 404 });
    }
    
    // ensure the corresponding projects is public
    if (chapter.project.visibility != "PUBLIC") return NextResponse.json({ error: 'project not existing' }, { status: 404 });
    
    // fetch
    const comments = await prisma.comment.findMany({
      where: { chapterId },
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

// POST: create a comment for specifix chapter
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ensure login
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'have not login' }, { status: 401 });
  }

  const { id: chapterId } = await ctx.params;
  const userId = session.user.id;
  const { content } = await request.json();

  // if a empty comment
  if (!content?.trim()) {
    return NextResponse.json({ error: 'comment cannot be empty' }, { status: 400 });
  }

  try {
    // ensure chapter exists and published
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId, status: "PUBLISHED" },
      include: { project: true },
    });
    if (!chapter) {
      return NextResponse.json({ error: 'chapter not existing' }, { status: 404 });
    }

    // ensure the corresponding project public
    if (chapter.project.visibility !== 'PUBLIC') return NextResponse.json({ error: 'project not existing' }, { status: 404 });

    // create
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        projectId: chapter.projectId,
        chapterId
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
