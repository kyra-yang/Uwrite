import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: get all published projects for public viewing
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const publishedProjects = await prisma.project.findMany({
      where: {
        visibility: 'PUBLIC'
      },
      select: {
        id: true,
        title: true,
        synopsis: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            chapters: {
              where: { status: 'PUBLISHED' } 
            },
            likes: true,
            comments: {
              where: { chapterId: null }
            },
          }
        },
        chapters: {
          where: {
              status: 'PUBLISHED',
          },
          select: {
            id: true,
            title: true,
            index: true,
            contentHtml: true,
          }
        },
        likes: userId ? {
          where: {
            userId: userId
          },
          select: {
            id: true
          }
        } : false,
      },
      
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format the details we need to return
    const formattedProjects = publishedProjects.map(project => ({
      id: project.id,
      title: project.title,
      synopsis: project.synopsis,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      owner: project.owner,
      chapterCount: project._count.chapters,
      likes: project._count.likes,
      comments: project._count.comments,
      // check if the current user has liked this project
      liked: userId ? project.likes.length > 0 : false,
      chapters: project.chapters
    }));

    return NextResponse.json(formattedProjects);
  } catch (e: any) {
    // any error
    console.error('Error fetching published projects:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}