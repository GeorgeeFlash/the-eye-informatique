import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"

export async function POST(req: Request) {
  const user = await requireRole(["ADMIN"])

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  // Store the file URL (in production, upload to cloud storage)
  // For now, we record the metadata and mark as ACTIVE
  await db.knowledgeBaseDocument.create({
    data: {
      fileName: file.name,
      fileUrl: `/uploads/kb/${file.name}`,
      uploadedById: user.id,
      status: "ACTIVE",
    },
  })

  return Response.json({ success: true })
}
