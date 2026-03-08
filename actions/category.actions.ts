"use server"

import { db } from "@/server/db"
import { requireRole } from "@/lib/auth"
import { categorySchema } from "@/lib/validators/category.schema"
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
    },
  })
}
