import { z } from "zod"

export const createRepairTicketSchema = z.object({
  requestType: z.enum(["EXCHANGE", "REPAIR", "RETURN"]),
  issueDescription: z.string().min(10, "Please describe the issue in detail"),
  productId: z.string().cuid().optional(),
  guaranteeCardId: z.string().cuid().optional(),
  branchId: z.string().cuid().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
})

export const updateRepairStatusSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "DIAGNOSED",
    "IN_REPAIR",
    "READY",
    "RETURNED",
    "CLOSED",
  ]),
  note: z.string().optional(),
})

export type CreateRepairTicketValues = z.infer<typeof createRepairTicketSchema>
export type UpdateRepairStatusValues = z.infer<typeof updateRepairStatusSchema>
