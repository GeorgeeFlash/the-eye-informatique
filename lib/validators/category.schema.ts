import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  parentId: z.string().min(1).nullable().optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export const featureFieldSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "DROPDOWN"]).default("TEXT"),
  options: z.array(z.string().min(1)).optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  isRequired: z.boolean().default(false),
}).refine(
  (data) => data.type !== "DROPDOWN" || (data.options && data.options.length >= 1),
  { message: "Dropdown type requires at least one option", path: ["options"] },
)

export type FeatureFieldFormValues = z.infer<typeof featureFieldSchema>
