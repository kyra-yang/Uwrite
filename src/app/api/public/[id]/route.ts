import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {

    const { id: projectId } = await ctx.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        visibility: 'PUBLIC',
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
          },
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
            createdAt: true,
          },
          orderBy: {
            index: 'asc',
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not public' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    // any error
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}