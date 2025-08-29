import { z } from 'zod';

// 1. project schemas
export const projectCreateSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().max(10_000).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional(),
});
// projet update
export const projectUpdateSchema = projectCreateSchema.partial();

// 2. chapter schemas
export const chapterCreateSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  contentJson: z.any().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
// chcapter update
export const chapterUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  contentJson: z.any().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No fields to update' }
);

// 3. schema for reordering chapters within a project
export const chapterReorderSchema = z.object({
  projectId: z.string().min(1),
  orderedChapterIds: z.array(z.string().min(1)).min(1)
});
