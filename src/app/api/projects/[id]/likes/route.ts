import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: like or unlike a project
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

  try {
    // ensure project exists and public
    const project = await prisma.project.findUnique({
      where: { id: projectId, visibility: 'PUBLIC' }
    });
    if (!project) return NextResponse.json({ error: 'project not existing' }, { status: 404 });

    // if like exists
    const existingLike = await prisma.like.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    // like exists, unlike
    if (existingLike) {
      await prisma.like.delete({
        where: { userId_projectId: { userId, projectId } }
      });
      return NextResponse.json({ liked: false });
    } else {
      // like does not exist, like
      await prisma.like.create({
        data: { userId, projectId }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    // any error
    console.error('something wrong occurred...about like', error);
    return NextResponse.json({ error: 'something wrong with the server' }, { status: 500 });
  }
}