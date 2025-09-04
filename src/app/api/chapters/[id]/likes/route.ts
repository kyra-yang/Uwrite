import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: like or unlike a chapter
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ensure login
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "have not login" }, { status: 401 });
  }

  const { id: chapterId } = await ctx.params;
  const userId = session.user.id;

  try {
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
    
    // if like exists
    const existingLike = await prisma.like.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    // like exists, unlike
    if (existingLike) {
      await prisma.like.delete({
        where: { userId_chapterId: { userId, chapterId } },
      });
      return NextResponse.json({ liked: false });
    } else {
      // like does not exist, like
      await prisma.like.create({
        data: { userId, chapterId }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    // any error
    console.error("Error in chapter like route:", error);
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
