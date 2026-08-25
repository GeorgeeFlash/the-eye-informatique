import { del } from "@vercel/blob"
import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { NextRequest } from "next/server"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export async function GET(request: NextRequest) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const take = Math.min(Math.max(Number(searchParams.get("take")) || 24, 1), 100)
  const cursor = searchParams.get("cursor")

  const assets = await db.imageAsset.findMany({
    where: {
      mimeType: { in: ALLOWED_MIME_TYPES as unknown as string[] },
      ...(search
        ? { fileName: { contains: search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      url: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  })

  const hasMore = assets.length > take
  const page = hasMore ? assets.slice(0, take) : assets
  const nextCursor = hasMore ? page[page.length - 1]!.id : null

  const referenced = await db.category.findMany({
    where: { iconUrl: { not: null } },
    select: { iconUrl: true },
  })
  const referencedUrls = new Set(referenced.map((c) => c.iconUrl))

  const blogReferences = await db.blogArticle.findMany({
    where: { coverImageUrl: { not: null } },
    select: { coverImageUrl: true },
  })
  for (const ref of blogReferences) {
    if (ref.coverImageUrl) referencedUrls.add(ref.coverImageUrl)
  }

  const images = page.map((a) => ({ ...a, inUse: referencedUrls.has(a.url) }))

  return Response.json({ images, nextCursor })
}

export async function DELETE(request: NextRequest) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return Response.json({ error: "missing_id" }, { status: 400 })
  }

  const asset = await db.imageAsset.findUnique({ where: { id } })
  if (!asset) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  const inUse = await db.category.count({
    where: { iconUrl: asset.url },
  })
  if (inUse > 0) {
    return Response.json({ error: "in_use" }, { status: 409 })
  }

  const blogInUse = await db.blogArticle.count({
    where: { coverImageUrl: asset.url },
  })
  if (blogInUse > 0) {
    return Response.json({ error: "in_use" }, { status: 409 })
  }

  await del(asset.url)
  await db.imageAsset.delete({ where: { id } })

  return Response.json({ success: true })
}
