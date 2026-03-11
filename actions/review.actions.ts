"use server"

import { db } from "@/server/db"
import { requireRole, requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewValues,
  type UpdateReviewValues,
} from "@/lib/validators/review.schema"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"

/* ─── Purchase eligibility check ────────────────────────── */

export async function canReviewProduct(productId: string) {
  const user = await requireAuth()

  // User must have a DELIVERED order containing an item whose variant belongs to this product
  const eligibleOrder = await db.order.findFirst({
    where: {
      userId: user.id,
      status: "DELIVERED",
      items: {
        some: {
          variant: { productId },
        },
      },
    },
    select: { id: true },
  })

  // Also check if user already has a review for this product
  const existingReview = await db.productReview.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  })

  return {
    canReview: !!eligibleOrder,
    hasExistingReview: !!existingReview,
  }
}

/* ─── Get user's own review ─────────────────────────────── */

export async function getMyReview(productId: string) {
  const user = await requireAuth()

  return db.productReview.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  })
}

/* ─── Create review ─────────────────────────────────────── */

export async function createReview(productId: string, data: CreateReviewValues) {
  const user = await requireAuth()
  const parsed = createReviewSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Check purchase eligibility
  const eligibleOrder = await db.order.findFirst({
    where: {
      userId: user.id,
      status: "DELIVERED",
      items: { some: { variant: { productId } } },
    },
    select: { id: true },
  })
  if (!eligibleOrder) return { error: "You must purchase this product before reviewing it." }

  // Check for existing review
  const existing = await db.productReview.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  })
  if (existing) return { error: "You have already reviewed this product." }

  const review = await db.productReview.create({
    data: {
      productId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      status: "PENDING",
    },
    select: { id: true },
  })

  revalidatePath("/[locale]/(storefront)/products/[slug]", "page")
  return { success: true, reviewId: review.id }
}

/* ─── Update review ─────────────────────────────────────── */

export async function updateReview(reviewId: string, data: UpdateReviewValues) {
  const user = await requireAuth()
  const parsed = updateReviewSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const review = await db.productReview.findUnique({ where: { id: reviewId } })
  if (!review) return { error: "Review not found." }
  if (review.userId !== user.id) return { error: "You can only edit your own review." }

  await db.productReview.update({
    where: { id: reviewId },
    data: {
      ...parsed.data,
      status: "PENDING",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    },
  })

  revalidatePath("/[locale]/(storefront)/products/[slug]", "page")
  return { success: true }
}

/* ─── Moderation actions ────────────────────────────────── */

export async function approveReview(reviewId: string) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  await db.productReview.update({
    where: { id: reviewId },
    data: {
      status: "APPROVED",
      approvedBy: user.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  })

  revalidatePath("/[locale]/(storefront)/products/[slug]", "page")
  revalidatePath("/[locale]/(dashboard)/admin/(admin)/reviews", "page")
  return { success: true }
}

export async function rejectReview(reviewId: string, reason: string) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  await db.productReview.update({
    where: { id: reviewId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
    },
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/reviews", "page")
  return { success: true }
}

export async function deleteReview(reviewId: string, reason: string) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const review = await db.productReview.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true, userId: true },
  })
  if (!review) return { error: "Review not found." }

  await db.productReview.delete({ where: { id: reviewId } })

  logActivity({
    action: "review_deleted",
    entityType: "ProductReview",
    entityId: reviewId,
    metadata: { reason, productId: review.productId, userId: review.userId },
  })

  revalidatePath("/[locale]/(storefront)/products/[slug]", "page")
  revalidatePath("/[locale]/(dashboard)/admin/(admin)/reviews", "page")
  return { success: true }
}

/* ─── Public: paginated product reviews ──────────────────  */

export async function getProductReviews(
  productId: string,
  {
    page = 1,
    pageSize = 10,
    sortBy = "newest",
  }: {
    page?: number
    pageSize?: number
    sortBy?: "newest" | "oldest" | "highest" | "lowest"
  } = {},
) {
  const orderBy = (() => {
    switch (sortBy) {
      case "oldest": return { createdAt: "asc" as const }
      case "highest": return { rating: "desc" as const }
      case "lowest": return { rating: "asc" as const }
      default: return { createdAt: "desc" as const }
    }
  })()

  const where = { productId, status: "APPROVED" as const }

  const [reviews, total, aggregate] = await Promise.all([
    db.productReview.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true } },
      },
    }),
    db.productReview.count({ where }),
    db.productReview.aggregate({
      where,
      _avg: { rating: true },
      _count: true,
    }),
  ])

  return {
    reviews,
    total,
    totalPages: Math.ceil(total / pageSize),
    averageRating: aggregate._avg.rating ?? 0,
    reviewCount: aggregate._count,
  }
}

/* ─── Admin: pending reviews for moderation ──────────────  */

export async function getPendingReviews({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status,
}: {
  page?: number
  pageSize?: number
  status?: "PENDING" | "APPROVED" | "REJECTED"
} = {}) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  // Branch scoping: STAFF/ADMIN see only reviews for their branch's products
  const branchFilter =
    user.role !== "CENTRAL_ADMIN" && user.branchId
      ? {
          product: {
            variants: {
              some: {
                stockByBranch: {
                  some: { branchId: user.branchId },
                },
              },
            },
          },
        }
      : {}

  const where = {
    ...(status ? { status } : { status: "PENDING" as const }),
    ...branchFilter,
  }

  const [reviews, total] = await Promise.all([
    db.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    db.productReview.count({ where }),
  ])

  return { reviews, total, totalPages: Math.ceil(total / pageSize) }
}
