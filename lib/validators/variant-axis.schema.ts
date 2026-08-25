import { z } from "zod"

export const variantAxisSchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

export const axisValueSchema = z.object({
  value: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  priceDelta: z.coerce.number().default(0),
})

export const skuTemplateSchema = z.string().max(200).optional()

export type VariantAxisInput = z.infer<typeof variantAxisSchema>
export type AxisValueInput = z.infer<typeof axisValueSchema>
export type SkuTemplateInput = z.infer<typeof skuTemplateSchema>
