"use server"

import { db } from "@/server/db"
import { requireRole } from "@/lib/auth"
import { variantAxisSchema, axisValueSchema, skuTemplateSchema } from "@/lib/validators/variant-axis.schema"
import { validateSkuTemplate } from "@/lib/sku-validator"
import { generateSkuFromTemplate } from "@/lib/sku-generator"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logActivity } from "@/lib/activity-log"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_VARIANTS = 200

function revalidateAll() {
  revalidatePath("/admin/products")
  revalidatePath("/admin/categories")
  revalidatePath("/admin/variants")
  revalidatePath("/products")
}

// ---------------------------------------------------------------------------
// Category Variant Axis CRUD
// ---------------------------------------------------------------------------

export async function createVariantAxis(
  categoryId: string,
  data: z.infer<typeof variantAxisSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = variantAxisSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const axis = await db.categoryVariantAxis.create({
    data: {
      categoryId,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    },
  })

  logActivity({
    action: "VARIANT_AXIS_CREATED",
    entityType: "CategoryVariantAxis",
    entityId: axis.id,
    metadata: { categoryId, name: axis.name },
  })

  revalidateAll()
  return { success: true, data: axis }
}

export async function updateVariantAxis(
  id: string,
  data: z.infer<typeof variantAxisSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = variantAxisSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const axis = await db.categoryVariantAxis.update({
    where: { id },
    data: {
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    },
  })

  logActivity({
    action: "VARIANT_AXIS_UPDATED",
    entityType: "CategoryVariantAxis",
    entityId: axis.id,
    metadata: { name: axis.name },
  })

  revalidateAll()
  return { success: true, data: axis }
}

export async function deleteVariantAxis(id: string) {
  await requireRole(["CENTRAL_ADMIN"])

  const optionsCount = await db.productVariantOption.count({
    where: { axisValue: { axisId: id } },
  })
  if (optionsCount > 0) {
    return { error: "Cannot delete an axis that is in use by product variants." }
  }

  await db.categoryVariantAxis.delete({ where: { id } })

  logActivity({
    action: "VARIANT_AXIS_DELETED",
    entityType: "CategoryVariantAxis",
    entityId: id,
  })

  revalidateAll()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Category Variant Axis Value CRUD
// ---------------------------------------------------------------------------

export async function createAxisValue(
  axisId: string,
  data: z.infer<typeof axisValueSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = axisValueSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const value = await db.categoryVariantAxisValue.create({
    data: {
      axisId,
      value: parsed.data.value,
      sortOrder: parsed.data.sortOrder,
      priceDelta: parsed.data.priceDelta,
    },
  })

  logActivity({
    action: "VARIANT_AXIS_VALUE_CREATED",
    entityType: "CategoryVariantAxisValue",
    entityId: value.id,
    metadata: { axisId, value: value.value },
  })

  revalidateAll()
  return { success: true, data: value }
}

export async function updateAxisValue(
  id: string,
  data: z.infer<typeof axisValueSchema>,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = axisValueSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const value = await db.categoryVariantAxisValue.update({
    where: { id },
    data: {
      value: parsed.data.value,
      sortOrder: parsed.data.sortOrder,
      priceDelta: parsed.data.priceDelta,
    },
  })

  logActivity({
    action: "VARIANT_AXIS_VALUE_UPDATED",
    entityType: "CategoryVariantAxisValue",
    entityId: value.id,
    metadata: { value: value.value },
  })

  revalidateAll()
  return { success: true, data: value }
}

export async function deleteAxisValue(id: string) {
  await requireRole(["CENTRAL_ADMIN"])

  const optionsCount = await db.productVariantOption.count({
    where: { axisValueId: id },
  })
  if (optionsCount > 0) {
    return { error: "Cannot delete a value that is in use by product variants." }
  }

  await db.categoryVariantAxisValue.delete({ where: { id } })

  logActivity({
    action: "VARIANT_AXIS_VALUE_DELETED",
    entityType: "CategoryVariantAxisValue",
    entityId: id,
  })

  revalidateAll()
  return { success: true }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getVariantAxesByCategory(categoryId: string) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { skuTemplate: true },
  })

  const axes = await db.categoryVariantAxis.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return {
    skuTemplate: category?.skuTemplate ?? null,
    axes: axes.map((axis) => ({
      ...axis,
      values: axis.values.map((v) => ({
        ...v,
        priceDelta: v.priceDelta ? Number(v.priceDelta) : null,
      })),
    })),
  }
}

// ---------------------------------------------------------------------------
// SKU Template
// ---------------------------------------------------------------------------

export async function updateCategorySkuTemplate(
  categoryId: string,
  skuTemplate: string | null,
) {
  await requireRole(["CENTRAL_ADMIN"])

  const parsed = skuTemplateSchema.safeParse(skuTemplate)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      variantAxes: { select: { name: true } },
    },
  })
  if (!category) return { error: "Category not found." }

  const template = parsed.data ?? null
  const validationError = validateSkuTemplate(template ?? "", category.variantAxes)
  if (validationError) return { error: validationError }

  const updated = await db.category.update({
    where: { id: categoryId },
    data: { skuTemplate: template },
  })

  logActivity({
    action: "SKU_TEMPLATE_UPDATED",
    entityType: "Category",
    entityId: categoryId,
    metadata: { skuTemplate: template },
  })

  revalidateAll()
  return { success: true, data: { skuTemplate: updated.skuTemplate } }
}

// ---------------------------------------------------------------------------
// Variant Generation
// ---------------------------------------------------------------------------

export async function generateVariantsFromAxes(
  productId: string,
  selectedAxisValueIds: string[][],
  options: {
    skuTemplate?: string
    autoGenerateSku?: boolean
    basePrice: number
  },
) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, categoryId: true, name: true, slug: true },
  })
  if (!product) return { error: "Product not found." }

  const category = await db.category.findUnique({
    where: { id: product.categoryId },
    include: {
      variantAxes: {
        orderBy: { sortOrder: "asc" },
        include: {
          values: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, value: true, priceDelta: true },
          },
        },
      },
    },
  })
  if (!category) return { error: "Category not found." }

  const axes = category.variantAxes
  if (axes.length === 0) return { error: "Category has no variant axes defined." }

  if (!selectedAxisValueIds || selectedAxisValueIds.length !== axes.length) {
    return { error: "Must select exactly one value per axis." }
  }

  for (const ids of selectedAxisValueIds) {
    if (ids.length === 0) return { error: "Each axis must have at least one value selected." }
  }

  const axisValueMap = new Map<string, { axisId: string; value: string; priceDelta: number }>()
  for (const axis of axes) {
    for (const v of axis.values) {
      axisValueMap.set(v.id, {
        axisId: axis.id,
        value: v.value,
        priceDelta: Number(v.priceDelta),
      })
    }
  }

  const cartesian = cartesianProduct(selectedAxisValueIds)

  if (cartesian.length > MAX_VARIANTS) {
    return { error: `Cannot generate more than ${MAX_VARIANTS} variants. Reduce axis values.` }
  }

  const existingSkus = new Set(
    (await db.productVariant.findMany({
      where: { productId },
      select: { sku: true },
    })).map((v) => v.sku),
  )

  const orderCount = await db.orderItem.count({
    where: { variant: { productId } },
  })
  if (orderCount > 0) {
    return { error: "Cannot regenerate variants for a product with existing order history." }
  }

  const template = options.skuTemplate ?? category.skuTemplate ?? ""
  const validationError = validateSkuTemplate(template, axes)
  if (validationError) return { error: validationError }

  const newSkus = new Set<string>()

  const generatedVariants = cartesian.map((combo, index) => {
    const axisNameValues: Record<string, string> = {}
    let totalDelta = 0

    for (let i = 0; i < axes.length; i++) {
      const valueData = axisValueMap.get(combo[i])!
      axisNameValues[axes[i].name] = valueData.value
      totalDelta += valueData.priceDelta
    }

    const computedPrice = Number(options.basePrice) + totalDelta

    let sku = ""
    if (options.autoGenerateSku && template) {
      sku = generateSkuFromTemplate(template, {
        productSlug: product.slug,
        productId: product.id,
        categorySlug: category.slug,
        axisValues: axisNameValues,
      })

      let suffix = 1
      let candidate = sku
      while (existingSkus.has(candidate) || newSkus.has(candidate)) {
        suffix++
        candidate = `${sku}-${suffix}`
        if (candidate.length > 80) {
          candidate = candidate.slice(0, 80).replace(/[-]+$/g, "")
        }
      }
      sku = candidate
      newSkus.add(sku)
    } else {
      sku = `SKU-${product.slug}-${index + 1}`
      let suffix = 1
      let candidate = sku
      while (existingSkus.has(candidate) || newSkus.has(candidate)) {
        suffix++
        candidate = `${sku}-${suffix}`
      }
      sku = candidate
      newSkus.add(sku)
    }

    return {
      sku,
      price: computedPrice,
      stock: 0,
      combo,
    }
  })

  const result = await db.$transaction(async (tx) => {
    await tx.productStockByBranch.deleteMany({ where: { variant: { productId } } })
    await tx.productVariantOption.deleteMany({ where: { variant: { productId } } })
    await tx.productVariant.deleteMany({ where: { productId } })

    for (const gv of generatedVariants) {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: gv.sku,
          condition: "NEW",
          stock: gv.stock,
          price: gv.price,
        },
      })

      for (const valueId of gv.combo) {
        await tx.productVariantOption.create({
          data: {
            variantId: variant.id,
            axisValueId: valueId,
          },
        })
      }
    }

    if (generatedVariants.length > 0) {
      const firstPrice = generatedVariants[0].price
      await tx.product.update({
        where: { id: productId },
        data: { basePrice: firstPrice },
      })
    }

    return generatedVariants
  })

  logActivity({
    action: "VARIANT_GENERATED",
    entityType: "Product",
    entityId: productId,
    metadata: { count: result.length, productName: product.name },
  })

  revalidateAll()
  return { success: true, data: { count: result.length } }
}

function cartesianProduct(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => {
      const result: string[][] = []
      for (const prev of acc) {
        for (const item of curr) {
          result.push([...prev, item])
        }
      }
      return result
    },
    [[]],
  )
}
