import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { formatDate } from "@/lib/utils"

export async function GET() {
  await requireRole(["CENTRAL_ADMIN"])

  const referrals = await db.affiliateReferral.findMany({
    include: {
      affiliate: {
        include: {
          user: { select: { name: true, email: true } },
          branch: { select: { name: true } },
        },
      },
      link: { select: { code: true } },
      order: { select: { orderNumber: true, total: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const header =
    "Date,Affiliate,Email,Branch,Link Code,Order #,Order Total (FCFA),Commission (FCFA),Status\n"

  const rows = referrals.map((r) => {
    const cols = [
      formatDate(r.createdAt),
      `"${(r.affiliate.user.name ?? "").replace(/"/g, '""')}"`,
      r.affiliate.user.email,
      r.affiliate.branch?.name ?? "",
      r.link.code,
      r.order?.orderNumber ?? "",
      r.order?.total.toNumber() ?? 0,
      r.commission.toNumber(),
      r.status,
    ]
    return cols.join(",")
  })

  const csv = header + rows.join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="affiliate-commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
