import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { aiRateLimit, getIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const user = await requireRole(["ADMIN"])

  const ip = getIp(req)
  const { success } = await aiRateLimit.limit(ip)
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 })
  }

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
