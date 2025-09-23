import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: get a specific published project by id for public viewing
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {

    const { id: projectId } = await ctx.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // find project
    const project = await prisma.project.findUnique({
      where: { id: projectId, visibility: 'PUBLIC' },
      include: {
        owner: { select: { id: true, name: true } },
        chapters: {
          where: { status: 'PUBLISHED' },
          orderBy: { index: 'asc' },
          select: {
            id: true,
            title: true,
            index: true,
            updatedAt: true,
            contentHtml: true,
            _count: {
              select: { likes: true }
            }
          }
        },
        _count: {
          select: {
            chapters: { where: { status: 'PUBLISHED' } },
            likes: true,
            comments: { where: { chapterId: null } },
          }
        },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not public' },
        { status: 404 }
      );
    }

     // check if liked for this chapter
    let userLikedChapterIds: string[] = [];
    if (userId) {
      const chapterIds = project.chapters.map(ch => ch.id!).filter(Boolean);
      userLikedChapterIds = (
        await prisma.like.findMany({
          where: { userId, chapterId: { in: chapterIds } },
          select: { chapterId: true },
        })
      ).map(like => like.chapterId!);
    }

    // format chapters with likes count and liked
    const chapters = project.chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      index: ch.index,
      updatedAt: ch.updatedAt,
      contentHtml: ch.contentHtml,
      likes: ch._count.likes,
      liked: userLikedChapterIds.includes(ch.id),
    }));

    // format project response
    const formattedProject = {
      id: project.id,
      title: project.title,
      synopsis: project.synopsis,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
      chapterCount: project._count.chapters,
      likes: project._count.likes,
      comments: project._count.comments,
      liked: userId ? (project.likes ? project.likes.length > 0 : false) : false,
      chapters,
    };

    return NextResponse.json(formattedProject);
  } catch (error) {
    // any error
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}