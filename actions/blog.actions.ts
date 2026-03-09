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

  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true, articleId: article.id }
}

/* ─── Update ────────────────────────────────────────────── */

export async function updateArticle(id: string, data: UpdateArticleValues) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const parsed = updateArticleSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { tagIds, content, ...rest } = parsed.data

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

/* ─── Delete ────────────────────────────────────────────── */

export async function deleteArticle(id: string) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  await db.blogArticle.update({
    where: { id },
    data: { status: "ARCHIVED" },
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
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
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
      tags: { select: { id: true, name: true, slug: true } },
    },
  })
}

/* ─── Tags ──────────────────────────────────────────────── */

export async function getTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } })
}
