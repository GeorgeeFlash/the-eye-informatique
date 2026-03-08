"use server"

import { db } from "@/server/db"
import { revalidatePath } from "next/cache"

export async function createArticle(data: {
  title: string
  slug: string
  content: unknown
  coverImageUrl?: string
  authorId: string
}) {
  // TODO: Create BlogArticle with DRAFT status
  void db
  void data
  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true, articleId: "" }
}

export async function updateArticle(id: string, data: Partial<{
  title: string
  content: unknown
  coverImageUrl: string
}>) {
  // TODO: Update article, re-validate SEO fields
  void db
  void id
  void data
  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

export async function publishArticle(id: string) {
  // TODO: Set status PUBLISHED, set publishedAt
  void db
  void id
  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}

export async function deleteArticle(id: string) {
  // TODO: Soft-delete or hard-delete article
  void db
  void id
  revalidatePath("/[locale]/(storefront)/blog", "page")
  return { success: true }
}
