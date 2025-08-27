import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authValidate";
import { projectCreateSchema } from "@/lib/validators";

// POST: create a new project
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = projectCreateSchema.parse(body);

    // create
    const project = await prisma.project.create({
      data: {
        ownerId: user.id,
        title: data.title,
        synopsis: data.synopsis ?? null,
        visibility: data.visibility ?? "PRIVATE",
      },
      select: { id: true, title: true, synopsis: true, visibility: true, createdAt: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (e: any) {
    // any error
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

// GET: list all projects of the user
export async function GET() {
  try {
    const user = await requireUser();
    // fins the target projects
    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, synopsis: true, visibility: true, updatedAt: true },
    });

    return NextResponse.json({ items: projects });
  } catch (e: any) {
    // any error
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
