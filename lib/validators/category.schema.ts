import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  parentId: z.string().cuid().nullable().optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
