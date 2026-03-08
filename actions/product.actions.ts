"use server"

import { db } from "@/server/db"
import { productSchema, productVariantSchema } from "@/lib/validators/product.schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Implement product creation with variant and image handling
  void db
  revalidatePath("/[locale]/(storefront)/products", "page")
  return { success: true }
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Implement product update
  void db
  void id
  revalidatePath("/[locale]/(storefront)/products", "page")
  return { success: true }
}

export async function deleteProduct(id: string) {
  // TODO: Soft-delete product (set isActive = false or deletedAt)
  void db
  void id
  revalidatePath("/[locale]/(storefront)/products", "page")
  return { success: true }
}

export async function createProductVariant(
  productId: string,
  data: z.infer<typeof productVariantSchema>
) {
  const parsed = productVariantSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Implement variant creation
  void db
  void productId
  return { success: true }
}
