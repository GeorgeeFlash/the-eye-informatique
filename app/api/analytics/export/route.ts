import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getAnalyticsKPIs, getCategorySalesChart, getTopProducts } from "@/actions/analytics.actions"
import { db } from "@/server/db"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])

  const params = request.nextUrl.searchParams
  const from = params.get("from")
  const to = params.get("to")
  const branchId = params.get("branchId")

  if (!from || !to) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 })
  }

  const range = { from: new Date(from), to: new Date(to) }
  const scopedBranch = user.role === "ADMIN" ? user.branchId : branchId

  const [kpis, categoryData, topProducts] = await Promise.all([
    getAnalyticsKPIs(range, scopedBranch),
    getCategorySalesChart(range, scopedBranch),
    getTopProducts(range, scopedBranch),
  ])

  // Build CSV
  const BOM = "\uFEFF"
  const lines: string[] = []

  lines.push("THE EYE INFORMATIQUE — Analytics Report")
  lines.push(`Period: ${format(range.from, "yyyy-MM-dd")} to ${format(range.to, "yyyy-MM-dd")}`)
  lines.push(`Branch: ${scopedBranch ?? "All"}`)
  lines.push("")

  // KPIs section
  lines.push("KPI,Value,Change (%)")
  lines.push(`Total Sales (XAF),${kpis.totalSales.value},${kpis.totalSales.change}`)
  lines.push(`Total Orders,${kpis.totalOrders.value},${kpis.totalOrders.change}`)
  lines.push(`Average Order Value (XAF),${kpis.avgOrderValue.value},${kpis.avgOrderValue.change}`)
  lines.push(`Products Sold,${kpis.productsSold.value},${kpis.productsSold.change}`)
  lines.push(`Affiliate Sales (XAF),${kpis.affiliateSales.value},${kpis.affiliateSales.change}`)
  lines.push(`Retention Rate (%),${kpis.retentionRate.value},${kpis.retentionRate.change}`)
  lines.push("")

  // Category sales
  lines.push("Sales by Category")
  lines.push("Category,Units,Revenue (XAF)")
  for (const cat of categoryData) {
    lines.push(`"${cat.name}",${cat.units},${cat.revenue}`)
  }
  lines.push("")

  // Top products
  lines.push("Top Products")
  lines.push("Product,SKU,Units Sold,Revenue (XAF)")
  for (const prod of topProducts) {
    lines.push(`"${prod.name}","${prod.sku}",${prod.unitsSold},${prod.revenue}`)
  }

  const csv = BOM + lines.join("\r\n")

  const branchLabel = scopedBranch ? `branch-${scopedBranch}` : "all-branches"
  const dateLabel = `${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}`
  const fileName = `analytics-${branchLabel}-${dateLabel}.csv`

  // Log export action
  await db.activityLog.create({
    data: {
      action: "EXPORT_ANALYTICS",
      userId: user.id,
      metadata: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        branchId: scopedBranch,
      },
    },
  })

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
