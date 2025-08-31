import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: get all published projects for public viewing
export async function GET() {
  try {
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
            }
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
        }
      },
      
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(publishedProjects);
  } catch (e: any) {
    // any error
    console.error('Error fetching published projects:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}