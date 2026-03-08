import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  categoryId: z.cuid(),
  brand: z.string().optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export const productVariantSchema = z.object({
  sku: z.string().min(1),
  color: z.string().optional(),
  condition: z.enum(["NEW", "REFURBISHED"]).default("NEW"),
  stock: z.coerce.number().int().nonnegative(),
  price: z.coerce.number().positive(),
  weight: z.coerce.number().positive().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>
