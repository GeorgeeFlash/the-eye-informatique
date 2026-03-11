"use server"

import { db } from "@/server/db"
import { requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  createArticleSchema,
  updateArticleSchema,
  type CreateArticleValues,
  type UpdateArticleValues,
} from "@/lib/validators/blog.schema"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { Prisma } from "@/lib/generated/prisma/client"
import { logActivity } from "@/lib/activity-log"
import { createLocalizedNotification } from "@/lib/notifications"

/* ─── Create ────────────────────────────────────────────── */

export async function createArticle(data: CreateArticleValues) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const parsed = createArticleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tagIds, ...rest } = parsed.data

  const article = await db.blogArticle.create({
    data: {
      ...rest,
      content: rest.content as object,
      authorId: user.id,
      ...(tagIds?.length
        ? { tags: { connect: tagIds.map((id) => ({ id })) } }
        : {}),
    },
  })

  logActivity({
    action: "ARTICLE_CREATED",
    entityType: "BlogArticle",
    entityId: article.id,
    metadata: { title: rest.title },
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true, articleId: article.id }
}

/* ─── Update ────────────────────────────────────────────── */

export async function updateArticle(id: string, data: UpdateArticleValues) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const parsed = updateArticleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await db.blogArticle.findUnique({ where: { id } })
  if (!existing) return { error: "Article not found" }

  const { tagIds, content, ...rest } = parsed.data

  // If the article is currently PUBLISHED, create a linked draft instead of editing in-place
  if (existing.status === "PUBLISHED") {
    const draft = await db.blogArticle.create({
      data: {
        title: rest.title ?? existing.title,
        slug: `${existing.slug}-draft-${Date.now()}`,
        content: content !== undefined ? (content as object) : (existing.content as object),
        excerpt: rest.excerpt !== undefined ? rest.excerpt : existing.excerpt,
        coverImageUrl: rest.coverImageUrl !== undefined ? rest.coverImageUrl : existing.coverImageUrl,
        locale: rest.locale ?? existing.locale,
        authorId: user.id,
        status: "DRAFT",
        draftOfId: existing.id,
        ...(tagIds?.length
          ? { tags: { connect: tagIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
    })
    revalidatePath("/[locale]/(dashboard)/admin/(admin)/blog", "page")
    return { success: true, articleId: draft.id, isDraft: true }
  }

  await db.blogArticle.update({
    where: { id },
    data: {
      ...rest,
      ...(content !== undefined ? { content: content as Prisma.InputJsonValue } : {}),
      ...(tagIds
        ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } }
        : {}),
    },
  })

  logActivity({
    action: "ARTICLE_UPDATED",
    entityType: "BlogArticle",
    entityId: id,
    metadata: { updatedFields: Object.keys(rest) },
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

/* ─── Publish / Unpublish ───────────────────────────────── */

export async function publishArticle(id: string) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  await db.blogArticle.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

export async function unpublishArticle(id: string) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  await db.blogArticle.update({
    where: { id },
    data: { status: "DRAFT", publishedAt: null },
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

/* ─── Approval Workflow ─────────────────────────────────── */

export async function submitForReview(id: string) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const article = await db.blogArticle.findUnique({ where: { id } })
  if (!article) return { error: "Article not found" }
  if (article.status !== "DRAFT") return { error: "Only drafts can be submitted for review" }

  await db.blogArticle.update({
    where: { id },
    data: {
      status: "PENDING_REVIEW",
      reviewedById: null,
      reviewedAt: null,
      reviewerNote: null,
    },
  })

  logActivity({
    action: "ARTICLE_SUBMITTED_FOR_REVIEW",
    entityType: "BlogArticle",
    entityId: id,
  })

  // Notify all ADMIN/CENTRAL_ADMIN users about the submission
  const admins = await db.user.findMany({
    where: { role: { in: ["ADMIN", "CENTRAL_ADMIN"] }, isActive: true },
    select: { id: true },
  })
  for (const admin of admins) {
    void createLocalizedNotification({
      userId: admin.id,
      type: "SYSTEM",
      messageKey: "articleSubmittedForReview",
      params: { articleTitle: article.title },
      link: `/admin/blog/${id}`,
    })
  }

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/blog", "page")
  return { success: true }
}

export async function approveArticle(id: string) {
  const user = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const article = await db.blogArticle.findUnique({ where: { id } })
  if (!article) return { error: "Article not found" }
  if (article.status !== "PENDING_REVIEW") return { error: "Only articles pending review can be approved" }

  // If this is a draft-of-published, merge content into the original and delete the draft
  if (article.draftOfId) {
    await db.$transaction([
      db.blogArticle.update({
        where: { id: article.draftOfId },
        data: {
          title: article.title,
          content: article.content as Prisma.InputJsonValue,
          excerpt: article.excerpt,
          coverImageUrl: article.coverImageUrl,
          locale: article.locale,
          updatedAt: new Date(),
        },
      }),
      // Move tags from draft to original
      db.blogArticle.update({
        where: { id: article.draftOfId },
        data: {
          tags: {
            set: await db.blogArticle
              .findUnique({ where: { id }, include: { tags: { select: { id: true } } } })
              .then((a) => a?.tags.map((t) => ({ id: t.id })) ?? []),
          },
        },
      }),
      db.blogArticle.delete({ where: { id } }),
    ])

    revalidatePath("/[locale]/(storefront)/blog", "page")
    revalidatePath("/[locale]/(dashboard)/admin/(admin)/blog", "page")
    return { success: true, mergedInto: article.draftOfId }
  }

  // Regular article approval: PENDING_REVIEW → PUBLISHED
  await db.blogArticle.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: article.publishedAt ?? new Date(),
      reviewedById: user.id,
      reviewedAt: new Date(),
      reviewerNote: null,
    },
  })

  logActivity({
    action: "ARTICLE_APPROVED",
    entityType: "BlogArticle",
    entityId: id,
  })

  // Notify the author
  void createLocalizedNotification({
    userId: article.authorId,
    type: "SYSTEM",
    messageKey: "articleApproved",
    params: { articleTitle: article.title },
    link: `/admin/blog/${id}`,
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  revalidatePath("/[locale]/(dashboard)/admin/(admin)/blog", "page")
  return { success: true }
}

export async function rejectArticle(id: string, note: string) {
  const user = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const article = await db.blogArticle.findUnique({ where: { id } })
  if (!article) return { error: "Article not found" }
  if (article.status !== "PENDING_REVIEW") return { error: "Only articles pending review can be rejected" }

  await db.blogArticle.update({
    where: { id },
    data: {
      status: "DRAFT",
      reviewedById: user.id,
      reviewedAt: new Date(),
      reviewerNote: note,
    },
  })

  logActivity({
    action: "ARTICLE_REJECTED",
    entityType: "BlogArticle",
    entityId: id,
    metadata: { note },
  })

  // Notify the author
  void createLocalizedNotification({
    userId: article.authorId,
    type: "SYSTEM",
    messageKey: "articleRejected",
    params: { articleTitle: article.title, reason: note },
    link: `/admin/blog/${id}`,
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/blog", "page")
  return { success: true }
}

/* ─── Delete ────────────────────────────────────────────── */

export async function deleteArticle(id: string) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  await db.blogArticle.update({
    where: { id },
    data: { status: "ARCHIVED" },
  })

  logActivity({
    action: "ARTICLE_DELETED",
    entityType: "BlogArticle",
    entityId: id,
  })

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

/* ─── Read — Public (published only) ────────────────────── */

export async function getPublishedArticles({
  page = 1,
  pageSize = 10,
  tag,
  search,
  locale,
}: {
  page?: number
  pageSize?: number
  tag?: string
  search?: string
  locale?: string
} = {}) {
  const where = {
    status: "PUBLISHED" as const,
    ...(locale ? { locale } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { excerpt: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [articles, total] = await Promise.all([
    db.blogArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { name: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.blogArticle.count({ where }),
  ])

  return { articles, total, totalPages: Math.ceil(total / pageSize) }
}

export async function getArticleBySlug(slug: string) {
  const article = await db.blogArticle.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: { select: { name: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  })

  if (article) {
    // Increment view count in the background
    db.blogArticle
      .update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {})
  }

  return article
}

/* ─── Read — Admin (all statuses) ───────────────────────── */

export async function getAdminArticles({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status,
}: {
  page?: number
  pageSize?: number
  status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED"
} = {}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const where = status ? { status } : { status: { not: "ARCHIVED" as const } }

  const [articles, total] = await Promise.all([
    db.blogArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { name: true } },
        reviewer: { select: { name: true } },
        tags: { select: { id: true, name: true, slug: true } },
        _count: true,
      },
    }),
    db.blogArticle.count({ where }),
  ])

  return { articles, total, totalPages: Math.ceil(total / pageSize) }
}

export async function getAdminArticle(id: string) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  return db.blogArticle.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      reviewer: { select: { name: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  })
}

/* ─── Tags ──────────────────────────────────────────────── */

export async function getTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } })
}

/* ─── Blog Analytics ────────────────────────────────────── */

export async function getBlogKPIs(range: { from: Date; to: Date }) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const dateFilter = { publishedAt: { gte: range.from, lte: range.to } }

  const [published, totalViews, pending, topAuthor, statusBreakdown] =
    await Promise.all([
      db.blogArticle.count({
        where: { status: "PUBLISHED", ...dateFilter },
      }),
      db.blogArticle.aggregate({
        where: { status: "PUBLISHED", ...dateFilter },
        _sum: { viewCount: true },
      }),
      db.blogArticle.count({ where: { status: "PENDING_REVIEW" } }),
      db.blogArticle.groupBy({
        by: ["authorId"],
        where: { status: "PUBLISHED", ...dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
      db.blogArticle.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ])

  let topAuthorName: string | null = null
  if (topAuthor[0]) {
    const user = await db.user.findUnique({
      where: { id: topAuthor[0].authorId },
      select: { name: true },
    })
    topAuthorName = user?.name ?? null
  }

  const views = totalViews._sum.viewCount ?? 0
  const avgViews = published > 0 ? Math.round(views / published) : 0

  return {
    totalPublished: published,
    totalViews: views,
    avgViewsPerArticle: avgViews,
    pendingReview: pending,
    topAuthor: topAuthorName,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
  }
}

export async function getArticleViewsChart(range: { from: Date; to: Date }) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const articles = await db.blogArticle.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: range.from, lte: range.to },
    },
    select: { publishedAt: true, viewCount: true },
    orderBy: { publishedAt: "asc" },
  })

  // Group by month
  const grouped = new Map<string, number>()
  for (const a of articles) {
    if (!a.publishedAt) continue
    const key = `${a.publishedAt.getFullYear()}-${String(a.publishedAt.getMonth() + 1).padStart(2, "0")}`
    grouped.set(key, (grouped.get(key) ?? 0) + a.viewCount)
  }

  return Array.from(grouped.entries()).map(([date, views]) => ({ date, views }))
}

export async function getTopArticles(range: { from: Date; to: Date }, limit = 10) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  return db.blogArticle.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: range.from, lte: range.to },
    },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      title: true,
      slug: true,
      viewCount: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: { select: { name: true } },
    },
  })
}

export async function getArticlesByTagChart(range: { from: Date; to: Date }) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const tags = await db.tag.findMany({
    select: {
      name: true,
      _count: {
        select: {
          blogArticles: {
            where: {
              status: "PUBLISHED",
              publishedAt: { gte: range.from, lte: range.to },
            },
          },
        },
      },
    },
    orderBy: { blogArticles: { _count: "desc" } },
  })

  return tags
    .filter((t) => t._count.blogArticles > 0)
    .map((t) => ({ tag: t.name, count: t._count.blogArticles }))
}
