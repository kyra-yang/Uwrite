import { prisma } from '@/lib/prisma';

// ensure the user owns the project
export async function assertOwnsProject(projectId: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!p || p.ownerId !== userId) throw new Error('FORBIDDEN');
}
