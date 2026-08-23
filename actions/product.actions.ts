"use server"

import { db } from "@/server/db"
import { Prisma } from "@/lib/generated/prisma/client"
import { requireRole, canManageBranch, type AuthUser } from "@/lib/auth"
import { productSchema, productSchemaBase, productVariantSchema } from "@/lib/validators/product.schema"
import { sanitizeHtml } from "@/lib/sanitize"
import { slugify } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { logActivity } from "@/lib/activity-log"

// ---------------------------------------------------------------------------
// Schemas for multi-step creation
// ---------------------------------------------------------------------------

const featureValueInput = z.object({
  featureFieldId: z.string().cuid(),
  value: z.string(),
})

const createProductInput = productSchema.extend({
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
  images: z.array(
    z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      sortOrder: z.coerce.number().int().nonnegative().default(0),
      isPrimary: z.boolean().default(false),
    }),
  ).min(1, "At least one image is required"),
  branchId: z.string().cuid().optional(),
  featureValues: z.array(featureValueInput).optional(),
})

type CreateProductInput = z.infer<typeof createProductInput>

const updateProductInput = productSchemaBase.partial().extend({
  images: z
    .array(
      z.object({
        id: z.string().cuid().optional(),
        url: z.string().url(),
        alt: z.string().optional(),
        sortOrder: z.coerce.number().int().nonnegative().default(0),
        isPrimary: z.boolean().default(false),
      }),
    )
    .optional(),
  featureValues: z.array(featureValueInput).optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required")
    .optional(),
  branchId: z.string().cuid().optional(),
})

type UpdateProductInput = z.infer<typeof updateProductInput>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function revalidateProducts() {
  revalidatePath("/admin/products")
  revalidatePath("/products")
}

/**
 * Ensure the user can access a product (branch-scoped for Staff/Admin, global for Central Admin).
 */
async function assertProductAccess(user: AuthUser, productId: string) {
  if (user.role === "CENTRAL_ADMIN") return

  const hasStock = await db.productStockByBranch.findFirst({
    where: { variant: { productId }, branchId: user.branchId! },
  })
  if (!hasStock) throw new Error("Access denied")
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createProduct(data: CreateProductInput) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const parsed = createProductInput.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { variants, images, branchId: inputBranchId, description, featureValues, ...productData } = parsed.data

  // Determine which branch to assign stock to
  const branchId = user.role === "CENTRAL_ADMIN" ? inputBranchId : user.branchId
  if (!branchId) return { error: "No branch context available." }

  const slug = productData.slug || slugify(productData.name)
  const existing = await db.product.findUnique({ where: { slug } })
  if (existing) return { error: "A product with this slug already exists." }

  // Check if any variant SKU already exists in DB
  const skus = variants.map((v) => v.sku)
  const existingSkus = await db.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { sku: true },
  })
  if (existingSkus.length > 0) {
    return { error: `SKU "${existingSkus[0].sku}" already exists in the system.` }
  }

  const sanitizedDesc = description ? sanitizeHtml(description) : null

  // Validate required feature fields if category is selected
  if (productData.categoryId) {
    const requiredFields = await db.categoryFeatureField.findMany({
      where: { categoryId: productData.categoryId, isRequired: true },
      select: { id: true, name: true },
    })
    for (const req of requiredFields) {
      const match = featureValues?.find((fv) => fv.featureFieldId === req.id && fv.value.trim() !== "")
      if (!match) {
        return { error: `Feature field "${req.name}" is required.` }
      }
    }
  }

  const product = await db.$transaction(async (tx) => {
    // Create the product
    const p = await tx.product.create({
      data: {
        ...productData,
        slug,
        description: sanitizedDesc,
      },
    })

    // Create images
    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img) => ({
          productId: p.id,
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
      })
    }

    // Create variants + per-branch stock
    for (const v of variants) {
      const variant = await tx.productVariant.create({
        data: {
          productId: p.id,
          sku: v.sku,
          color: v.color ?? null,
          condition: v.condition,
          price: v.price,
          weight: v.weight ?? null,
          stock: v.stock,
        },
      })

      await tx.productStockByBranch.create({
        data: {
          variantId: variant.id,
          branchId,
          stock: v.stock,
        },
      })
    }

    // Create feature values (filtering only valid fields for category)
    if (featureValues && featureValues.length > 0 && productData.categoryId) {
      const validCategoryFields = await tx.categoryFeatureField.findMany({
        where: { categoryId: productData.categoryId },
        select: { id: true },
      })
      const validFieldIds = new Set(validCategoryFields.map((f) => f.id))
      const filteredFeatureValues = featureValues.filter((fv) => validFieldIds.has(fv.featureFieldId) && fv.value.trim() !== "")

      if (filteredFeatureValues.length > 0) {
        await tx.productFeatureValue.createMany({
          data: filteredFeatureValues.map((fv) => ({
            productId: p.id,
            featureFieldId: fv.featureFieldId,
            value: fv.value,
          })),
        })
      }
    }

    return p
  })

  logActivity({
    action: "PRODUCT_CREATED",
    entityType: "Product",
    entityId: product.id,
    metadata: { name: parsed.data.name, slug, branchId },
  })

  revalidateProducts()
  return { success: true, data: { id: product.id, slug: product.slug } }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updateProduct(id: string, data: UpdateProductInput) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  await assertProductAccess(user, id)

  const parsed = updateProductInput.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { images, description, slug, featureValues, variants, branchId: inputBranchId, ...fields } = parsed.data

  // Slug uniqueness check if changing
  if (slug) {
    const conflict = await db.product.findFirst({
      where: { slug, NOT: { id } },
    })
    if (conflict) return { error: "A product with this slug already exists." }
  }

  // Branch context
  const branchId = user.role === "CENTRAL_ADMIN" ? inputBranchId : user.branchId

  const sanitizedDesc = description !== undefined ? (description ? sanitizeHtml(description) : null) : undefined

  // Validate required category features if categoryId is updated or existing
  const targetCategoryId = fields.categoryId ?? (await db.product.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId
  if (targetCategoryId && featureValues) {
    const requiredFields = await db.categoryFeatureField.findMany({
      where: { categoryId: targetCategoryId, isRequired: true },
      select: { id: true, name: true },
    })
    for (const req of requiredFields) {
      const match = featureValues.find((fv) => fv.featureFieldId === req.id && fv.value.trim() !== "")
      if (!match) {
        return { error: `Feature field "${req.name}" is required.` }
      }
    }
  }

  await db.$transaction(async (tx) => {
    // 1. Update product base record
    await tx.product.update({
      where: { id },
      data: {
        ...fields,
        ...(slug && { slug }),
        ...(sanitizedDesc !== undefined && { description: sanitizedDesc }),
      },
    })

    // 2. Replace images if provided
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img) => ({
            productId: id,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        })
      }
    }

    // 3. Replace feature values if provided (filtered to target category)
    if (featureValues && targetCategoryId) {
      await tx.productFeatureValue.deleteMany({ where: { productId: id } })
      const validCategoryFields = await tx.categoryFeatureField.findMany({
        where: { categoryId: targetCategoryId },
        select: { id: true },
      })
      const validFieldIds = new Set(validCategoryFields.map((f) => f.id))
      const filteredFeatureValues = featureValues.filter((fv) => validFieldIds.has(fv.featureFieldId) && fv.value.trim() !== "")

      if (filteredFeatureValues.length > 0) {
        await tx.productFeatureValue.createMany({
          data: filteredFeatureValues.map((fv) => ({
            productId: id,
            featureFieldId: fv.featureFieldId,
            value: fv.value,
          })),
        })
      }
    }

    // 4. Reconcile variants if provided
    if (variants && variants.length > 0) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        include: { stockByBranch: true },
      })

      const incomingIds = new Set(variants.map((v) => v.id).filter(Boolean) as string[])

      // Update or create incoming variants
      for (const v of variants) {
        if (v.id && existingVariants.some((ev) => ev.id === v.id)) {
          // Update existing variant
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku,
              color: v.color ?? null,
              condition: v.condition,
              price: v.price,
              weight: v.weight ?? null,
              stock: v.stock,
            },
          })

          // Sync stockByBranch if branchId is known
          if (branchId) {
            await tx.productStockByBranch.upsert({
              where: {
                variantId_branchId: { variantId: v.id, branchId },
              },
              create: { variantId: v.id, branchId, stock: v.stock },
              update: { stock: v.stock },
            })
          }
        } else {
          // Check SKU conflict for new variant
          const skuConflict = await tx.productVariant.findFirst({
            where: { sku: v.sku },
          })
          if (skuConflict && skuConflict.productId !== id) {
            throw new Error(`SKU "${v.sku}" already belongs to another product.`)
          }

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: id,
              sku: v.sku,
              color: v.color ?? null,
              condition: v.condition,
              price: v.price,
              weight: v.weight ?? null,
              stock: v.stock,
            },
          })

          if (branchId) {
            await tx.productStockByBranch.create({
              data: { variantId: createdVariant.id, branchId, stock: v.stock },
            })
          }
        }
      }

      // Handle removed variants
      const removedVariants = existingVariants.filter((ev) => !incomingIds.has(ev.id))
      for (const rv of removedVariants) {
        const orderCount = await tx.orderItem.count({
          where: { variantId: rv.id },
        })
        if (orderCount > 0) {
          // Order references exist — zero out stock to keep data intact
          await tx.productVariant.update({
            where: { id: rv.id },
            data: { stock: 0 },
          })
          await tx.productStockByBranch.updateMany({
            where: { variantId: rv.id },
            data: { stock: 0 },
          })
        } else {
          // Safe to delete variant & associated records
          await tx.productStockByBranch.deleteMany({ where: { variantId: rv.id } })
          await tx.productVariant.delete({ where: { id: rv.id } })
        }
      }
    }
  })

  logActivity({
    action: "PRODUCT_UPDATED",
    entityType: "Product",
    entityId: id,
    metadata: { updatedFields: Object.keys(fields), variantsUpdated: Boolean(variants) },
  })

  revalidateProducts()
  return { success: true }
}

// ---------------------------------------------------------------------------
// DELETE (soft-delete)
// ---------------------------------------------------------------------------

export async function deleteProduct(id: string) {
  const user = await requireRole(["ADMIN", "CENTRAL_ADMIN"])
  await assertProductAccess(user, id)

  await db.product.update({
    where: { id },
    data: { isActive: false },
  })

  logActivity({
    action: "PRODUCT_DELETED",
    entityType: "Product",
    entityId: id,
  })

  revalidateProducts()
  return { success: true }
}

// ---------------------------------------------------------------------------
// VARIANT CRUD
// ---------------------------------------------------------------------------

export async function createProductVariant(
  productId: string,
  data: z.infer<typeof productVariantSchema>,
  targetBranchId?: string,
) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  await assertProductAccess(user, productId)

  const parsed = productVariantSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  // CENTRAL_ADMIN must supply an explicit branchId; scoped roles use their own.
  const branchId = user.role === "CENTRAL_ADMIN" ? targetBranchId : user.branchId
  if (!branchId) return { error: "No branch context." }

  const variant = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.create({
      data: {
        productId,
        sku: parsed.data.sku,
        color: parsed.data.color ?? null,
        condition: parsed.data.condition,
        price: parsed.data.price,
        weight: parsed.data.weight ?? null,
        stock: parsed.data.stock,
      },
    })

    await tx.productStockByBranch.create({
      data: { variantId: v.id, branchId, stock: parsed.data.stock },
    })

    return v
  })

  revalidateProducts()
  return { success: true, data: { id: variant.id } }
}

// ---------------------------------------------------------------------------
// STOCK MANAGEMENT
// ---------------------------------------------------------------------------

const updateStockInput = z.object({
  variantId: z.string().cuid(),
  branchId: z.string().cuid(),
  quantity: z.coerce.number().int(),
})

export async function updateStock(data: z.infer<typeof updateStockInput>) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const parsed = updateStockInput.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  if (!canManageBranch(user, parsed.data.branchId)) {
    return { error: "Access denied for this branch." }
  }

  // Upsert stock record
  await db.productStockByBranch.upsert({
    where: {
      variantId_branchId: {
        variantId: parsed.data.variantId,
        branchId: parsed.data.branchId,
      },
    },
    create: {
      variantId: parsed.data.variantId,
      branchId: parsed.data.branchId,
      stock: parsed.data.quantity,
    },
    update: {
      stock: parsed.data.quantity,
    },
  })

  // Also sync the aggregate stock on the variant
  const aggregate = await db.productStockByBranch.aggregate({
    where: { variantId: parsed.data.variantId },
    _sum: { stock: true },
  })

  await db.productVariant.update({
    where: { id: parsed.data.variantId },
    data: { stock: aggregate._sum.stock ?? 0 },
  })

  logActivity({
    action: "STOCK_UPDATED",
    entityType: "ProductVariant",
    entityId: parsed.data.variantId,
    metadata: { branchId: parsed.data.branchId, newQuantity: parsed.data.quantity },
  })

  revalidateProducts()
  return { success: true }
}

/**
 * Central Admin: share a product with another branch by creating stock records.
 */
export async function addProductToBranch(productId: string, branchId: string) {
  await requireRole(["CENTRAL_ADMIN"])

  const variants = await db.productVariant.findMany({
    where: { productId },
    select: { id: true },
  })

  if (variants.length === 0) return { error: "Product has no variants." }

  // Create stock records for each variant that doesn't already have one for this branch
  for (const v of variants) {
    await db.productStockByBranch.upsert({
      where: {
        variantId_branchId: { variantId: v.id, branchId },
      },
      create: { variantId: v.id, branchId, stock: 0 },
      update: {},
    })
  }

  revalidateProducts()
  return { success: true }
}

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

export async function getProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: {
          stockByBranch: { include: { branch: { select: { id: true, name: true, city: true } } } },
        },
      },
      featureValues: {
        include: { featureField: true },
      },
    },
  })
}

export async function getProductBySlug(slug: string) {
  const [product, aggregate] = await Promise.all([
    db.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: {
            stockByBranch: { include: { branch: { select: { id: true, name: true, city: true } } } },
          },
        },
        featureValues: {
          include: { featureField: true },
        },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    db.product.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    }).then(async (p) => {
      if (!p) return { avg: null, count: 0 };
      const agg = await db.productReview.aggregate({
        where: { productId: p.id, status: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true },
      });
      return { avg: agg._avg.rating, count: agg._count.id };
    }),
  ]);

  if (!product) return null;

  return { ...product, reviewAggregate: aggregate };
}

interface GetProductsParams {
  search?: string
  categoryId?: string
  branchId?: string | null
  isActive?: boolean
  isFeatured?: boolean
  condition?: "NEW" | "REFURBISHED"
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock"
  featureFilters?: Record<string, string>
  page?: number
  pageSize?: number
}

export async function getProducts({
  search,
  categoryId,
  branchId,
  isActive,
  isFeatured,
  condition,
  stockStatus,
  featureFilters,
  page = 1,
  pageSize = 20,
}: GetProductsParams = {}) {
  const where: Prisma.ProductWhereInput = {}

  if (isActive !== undefined) where.isActive = isActive
  if (isFeatured !== undefined) where.isFeatured = isFeatured
  if (categoryId) where.categoryId = categoryId
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  // Feature value filters (featureFieldId → value)
  if (featureFilters && Object.keys(featureFilters).length > 0) {
    where.AND = Object.entries(featureFilters).map(([featureFieldId, value]) => ({
      featureValues: {
        some: { featureFieldId, value },
      },
    }))
  }

  // Stock status filter
  if (stockStatus && stockStatus !== "all") {
    if (stockStatus === "in_stock") {
      where.variants = {
        some: {
          stock: { gt: 0 },
          ...(branchId ? { stockByBranch: { some: { branchId } } } : {}),
        },
      }
    } else if (stockStatus === "low_stock") {
      where.variants = {
        some: {
          stock: { lte: 3, gt: 0 },
          ...(branchId ? { stockByBranch: { some: { branchId } } } : {}),
        },
      }
    } else if (stockStatus === "out_of_stock") {
      where.variants = {
        every: {
          stock: 0,
        },
      }
    }
  }

  // Condition filter: products that have at least one variant with given condition
  if (condition) {
    where.variants = {
      ...(where.variants ?? {}),
      some: {
        condition,
        ...(branchId ? { stockByBranch: { some: { branchId } } } : {}),
      },
    }
  } else if (branchId && !stockStatus) {
    // Branch scoping: only show products that have stock at the given branch
    where.variants = {
      some: { stockByBranch: { some: { branchId } } },
    }
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: {
          select: { id: true, price: true, stock: true, condition: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ])

  return { products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Get products with low stock for admin alerts.
 */
export async function getLowStockProducts(branchId?: string) {
  const lowStockRecords = await db.productStockByBranch.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
    },
    include: {
      variant: {
        include: { product: { select: { id: true, name: true, slug: true } } },
      },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { stock: "asc" },
  })

  // Filter in JS for stock <= threshold comparison
  return lowStockRecords.filter((r) => r.stock <= r.lowStockThreshold)
}

/**
 * Get consolidated stock across all branches for the inventory view.
 */
export async function getConsolidatedStock(branchId?: string) {
  const records = await db.productStockByBranch.findMany({
    where: branchId ? { branchId } : {},
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, slug: true, isActive: true } },
        },
      },
      branch: { select: { id: true, name: true } },
    },
    orderBy: [
      { variant: { product: { name: "asc" } } },
      { variant: { sku: "asc" } },
      { branch: { name: "asc" } },
    ],
  })

  return records
}
