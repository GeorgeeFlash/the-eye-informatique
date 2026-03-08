import { z } from "zod"

export const affiliateApplicationSchema = z.object({
  payoutMethod: z.literal("MOBILE_MONEY").default("MOBILE_MONEY"),
  payoutPhone: z
    .string()
    .regex(/^(\+237|237)?[6][5-9]\d{7}$/, "Enter a valid Cameroon mobile number"),
  motivation: z.string().min(10).max(500),
})

export const affiliateLinkSchema = z.object({
  targetUrl: z.string().url(),
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
})

export type AffiliateApplicationValues = z.infer<typeof affiliateApplicationSchema>
export type AffiliateLinkValues = z.infer<typeof affiliateLinkSchema>
