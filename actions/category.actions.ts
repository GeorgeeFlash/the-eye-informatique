"use server"

import { db } from "@/server/db"
import { requireRole } from "@/lib/auth"
import { categorySchema } from "@/lib/validators/category.schema"
import { featureFieldSchema } from "@/lib/validators/category.schema"
import { slugify } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function createCategory(
  data: z.infer<typeof categorySchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const slug = parsed.data.slug || slugify(parsed.data.name)

  const existing = await db.category.findUnique({ where: { slug } })
  if (existing) return { error: "A category with this slug already exists." }

  const category = await db.category.create({
    data: {
      name: parsed.data.name,
      slug,
      parentId: parsed.data.parentId ?? null,
      iconUrl: parsed.data.iconUrl,
      sortOrder: parsed.data.sortOrder,
    },
  })

  revalidatePath("/admin/products")
  return { success: true, data: category }
}

export async function updateCategory(
  id: string,
  data: z.infer<typeof categorySchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const slug = parsed.data.slug || slugify(parsed.data.name)

  const existing = await db.category.findFirst({
    where: { slug, NOT: { id } },
  })
  if (existing) return { error: "A category with this slug already exists." }

  const category = await db.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      parentId: parsed.data.parentId ?? null,
      iconUrl: parsed.data.iconUrl,
      sortOrder: parsed.data.sortOrder,
    },
  })

  revalidatePath("/admin/products")
  return { success: true, data: category }
}

export async function deleteCategory(id: string) {
  await requireRole(["CENTRAL_ADMIN"])

  // Prevent deletion if category has products
  const productsCount = await db.product.count({
    where: { categoryId: id },
  })
  if (productsCount > 0) {
    return { error: "Cannot delete a category that has products. Reassign products first." }
  }

  // Re-parent children to null
  await db.category.updateMany({
    where: { parentId: id },
    data: { parentId: null },
  })

  await db.category.delete({ where: { id } })

  revalidatePath("/admin/products")
  return { success: true }
}

/**
 * Public: returns all categories as a flat list (with parentId for tree building).
 */
export async function getCategories() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      products: {
        take: 1,
        orderBy: { createdAt: "asc" },
        where: { isActive: true },
        select: { images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } } },
      },
    },
  })
}

/**
 * Returns a single category with its feature field definitions.
 */
export async function getCategoryWithFeatureFields(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      featureFields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  })
}

/**
 * Returns just the feature fields for a given category (for the product form).
 */
export async function getFeatureFieldsByCategory(categoryId: string) {
  return db.categoryFeatureField.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
  })
}

// ---------------------------------------------------------------------------
// Feature Field CRUD
// ---------------------------------------------------------------------------

export async function createFeatureField(
  categoryId: string,
  data: z.infer<typeof featureFieldSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = featureFieldSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const field = await db.categoryFeatureField.create({
    data: {
      categoryId,
      name: parsed.data.name,
      type: parsed.data.type,
      options: parsed.data.type === "DROPDOWN" ? parsed.data.options : undefined,
      sortOrder: parsed.data.sortOrder,
      isRequired: parsed.data.isRequired,
    },
  })

  revalidatePath("/admin/categories")
  return { success: true, data: field }
}

export async function updateFeatureField(
  id: string,
  data: z.infer<typeof featureFieldSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = featureFieldSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const field = await db.categoryFeatureField.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      options: parsed.data.type === "DROPDOWN" ? parsed.data.options : undefined,
      sortOrder: parsed.data.sortOrder,
      isRequired: parsed.data.isRequired,
    },
  })

  revalidatePath("/admin/categories")
  return { success: true, data: field }
}

export async function deleteFeatureField(id: string) {
  await requireRole(["CENTRAL_ADMIN"])

  await db.categoryFeatureField.delete({ where: { id } })

  revalidatePath("/admin/categories")
  return { success: true }
}
