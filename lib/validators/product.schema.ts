import { z } from "zod";

export const productSchemaBase = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only",
    ),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).nullish(),
  commissionValue: z.coerce.number().positive().nullish(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const productSchema = productSchemaBase.superRefine((data, ctx) => {
  if (data.commissionType && !data.commissionValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Commission value is required when a type is selected",
      path: ["commissionValue"],
    });
  }
  if (
    data.commissionType === "PERCENTAGE" &&
    data.commissionValue &&
    data.commissionValue > 100
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage cannot exceed 100",
      path: ["commissionValue"],
    });
  }
});

export const productVariantSchema = z.object({
  id: z.string().min(1).optional(),
  sku: z.string().min(1),
  color: z.string().optional(),
  condition: z.enum(["NEW", "REFURBISHED"]).default("NEW"),
  stock: z.coerce.number().int().nonnegative(),
  price: z.coerce.number().positive(),
  weight: z.coerce.number().positive().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;
