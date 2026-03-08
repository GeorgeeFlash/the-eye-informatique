import { z } from "zod"

export const createArticleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.unknown(),
  excerpt: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional(),
  locale: z.enum(["en", "fr"]).default("en"),
  tagIds: z.array(z.string()).optional(),
})

export const updateArticleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content: z.unknown().optional(),
  excerpt: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  locale: z.enum(["en", "fr"]).optional(),
  tagIds: z.array(z.string()).optional(),
})

export type CreateArticleValues = z.infer<typeof createArticleSchema>
export type UpdateArticleValues = z.infer<typeof updateArticleSchema>
