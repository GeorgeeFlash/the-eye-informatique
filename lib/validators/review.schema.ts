import { z } from "zod"

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
})

export type CreateReviewValues = z.infer<typeof createReviewSchema>
export type UpdateReviewValues = z.infer<typeof updateReviewSchema>
