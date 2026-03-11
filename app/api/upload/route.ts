import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]

const ALLOWED_FOLDERS = ["products", "blog"] as const

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll("files") as File[]
  const folder = (formData.get("folder") as string) ?? "products"

  if (!ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
  }

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  const maxFiles = 10
  if (files.length > maxFiles) {
    return NextResponse.json(
      { error: `Maximum ${maxFiles} files allowed` },
      { status: 400 },
    )
  }

  const results: { url: string; fileName: string; size: number; mimeType: string }[] = []

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds 10 MB limit` },
        { status: 400 },
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 },
      )
    }

    const prefix = `${folder}/${Date.now()}`

    const blob = await put(`${prefix}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    results.push({
      url: blob.url,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    })
  }

  return NextResponse.json({ files: results })
}
