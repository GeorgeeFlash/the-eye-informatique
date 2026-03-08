import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireRole(["ADMIN"])
  const { id } = await params

  await db.knowledgeBaseDocument.delete({ where: { id } })
  return Response.json({ success: true })
}
