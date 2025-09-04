import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: get published project by id with chapters for public viewing
export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const { id: projectId } = ctx.params;
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
            contentHtml: true,
            likes: userId ? { where: { userId }, select: { id: true } } : false,
          }
        },
        _count: {
          select: {
            chapters: { where: { status: 'PUBLISHED' } },
            likes: true,
            comments: true,
          }
        },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        comments: { select: { id: true } },
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or not public' }, { status: 404 });
    }

    // format chapters with likes count and liked
    const chapters = project.chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      index: ch.index,
      contentHtml: ch.contentHtml,
      likes: ch.likes ? ch.likes.length : 0,
      liked: userId ? (ch.likes ? ch.likes.length > 0 : false) : false,
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
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
