"use server"

import { db } from "@/server/db"
import { requireRole, getCurrentUser } from "@/lib/auth"
import { Prisma } from "@/lib/generated/prisma/client"
import { cookies } from "next/headers"

type DateRange = { from: Date; to: Date }

function previousPeriod(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime()
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime()),
  }
}

function branchFilter(branchId?: string | null) {
  return branchId ? { branchId } : {}
}

/**
 * Track a product page view. Uses a session-based cookie for deduplication
 * (one view per product per session, max once every 30 minutes).
 */
export async function trackProductPageView(productId: string) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get("ppv_session")?.value
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    cookieStore.set("ppv_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })
  }

  const user = await getCurrentUser()

  // Dedup: skip if same session+product viewed in the last 30 minutes
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  const recent = await db.productPageView.findFirst({
    where: {
      sessionId,
      productId,
      createdAt: { gte: thirtyMinAgo },
    },
  })
  if (recent) return

  await db.productPageView.create({
    data: {
      productId,
      sessionId,
      userId: user?.id ?? null,
      branchId: user?.branchId ?? null,
    },
  })
}

export async function getAnalyticsKPIs(
  range: DateRange,
  filterBranchId?: string | null,
) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const scopedBranchId =
    user.role === "ADMIN" ? user.branchId : filterBranchId

  const prev = previousPeriod(range)
  const dateFilter = { createdAt: { gte: range.from, lte: range.to } }
  const prevDateFilter = { createdAt: { gte: prev.from, lte: prev.to } }

  const completedStatuses: Array<"DELIVERED"> = ["DELIVERED"]

  // Current period
  const [
    currentOrders,
    previousOrders,
    currentInStore,
    previousInStore,
    currentAffiliateOrders,
    previousAffiliateOrders,
    currentDistinctProducts,
    previousDistinctProducts,
    currentReturnCustomers,
    currentTotalCustomers,
    previousReturnCustomers,
    previousTotalCustomers,
    currentPageViews,
    previousPageViews,
  ] = await Promise.all([
    // Current completed orders
    db.order.aggregate({
      where: {
        ...dateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
      },
      _sum: { total: true },
      _count: true,
    }),
    // Previous completed orders
    db.order.aggregate({
      where: {
        ...prevDateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
      },
      _sum: { total: true },
      _count: true,
    }),
    // Current in-store purchases — InStorePurchase has no branchId column so it
    // cannot be scoped to a branch. Exclude from branch-scoped views to avoid
    // leaking cross-branch revenue data (only include for Central Admin / global view).
    scopedBranchId
      ? Promise.resolve({ _sum: { totalAmount: null } })
      : db.inStorePurchase.aggregate({
          where: {
            purchaseDate: { gte: range.from, lte: range.to },
          },
          _sum: { totalAmount: true },
        }),
    // Previous in-store purchases (same scoping logic as above)
    scopedBranchId
      ? Promise.resolve({ _sum: { totalAmount: null } })
      : db.inStorePurchase.aggregate({
          where: {
            purchaseDate: { gte: prev.from, lte: prev.to },
          },
          _sum: { totalAmount: true },
        }),
    // Current affiliate-referred orders
    db.order.aggregate({
      where: {
        ...dateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
        referral: { isNot: null },
      },
      _sum: { total: true },
    }),
    // Previous affiliate-referred orders
    db.order.aggregate({
      where: {
        ...prevDateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
        referral: { isNot: null },
      },
      _sum: { total: true },
    }),
    // Current distinct products sold
    db.orderItem.findMany({
      where: {
        order: {
          ...dateFilter,
          status: { in: completedStatuses },
          ...branchFilter(scopedBranchId),
        },
      },
      select: { variantId: true },
      distinct: ["variantId"],
    }),
    // Previous distinct products sold
    db.orderItem.findMany({
      where: {
        order: {
          ...prevDateFilter,
          status: { in: completedStatuses },
          ...branchFilter(scopedBranchId),
        },
      },
      select: { variantId: true },
      distinct: ["variantId"],
    }),
    // Current return customers (>1 order)
    db.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*) as cnt FROM (
        SELECT "userId" FROM "Order"
        WHERE "createdAt" >= ${range.from} AND "createdAt" <= ${range.to}
          AND "status" IN ('DELIVERED')
          ${scopedBranchId ? Prisma.sql`AND "branchId" = ${scopedBranchId}` : Prisma.empty}
        GROUP BY "userId" HAVING COUNT(*) > 1
      ) t
    `,
    // Current total unique customers
    db.order.findMany({
      where: {
        ...dateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Previous return customers
    db.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*) as cnt FROM (
        SELECT "userId" FROM "Order"
        WHERE "createdAt" >= ${prev.from} AND "createdAt" <= ${prev.to}
          AND "status" IN ('DELIVERED')
          ${scopedBranchId ? Prisma.sql`AND "branchId" = ${scopedBranchId}` : Prisma.empty}
        GROUP BY "userId" HAVING COUNT(*) > 1
      ) t
    `,
    // Previous total unique customers
    db.order.findMany({
      where: {
        ...prevDateFilter,
        status: { in: completedStatuses },
        ...branchFilter(scopedBranchId),
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // Current product page views
    db.productPageView.count({
      where: {
        ...dateFilter,
        ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
      },
    }),
    // Previous product page views
    db.productPageView.count({
      where: {
        ...prevDateFilter,
        ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
      },
    }),
  ])

  const curSales =
    Number(currentOrders._sum.total ?? 0) +
    Number(currentInStore._sum.totalAmount ?? 0)
  const prevSales =
    Number(previousOrders._sum.total ?? 0) +
    Number(previousInStore._sum.totalAmount ?? 0)

  const curOrderCount = currentOrders._count
  const prevOrderCount = previousOrders._count
  const curAOV = curOrderCount > 0 ? curSales / curOrderCount : 0
  const prevAOV = prevOrderCount > 0 ? prevSales / prevOrderCount : 0

  const curAffSales = Number(currentAffiliateOrders._sum.total ?? 0)
  const prevAffSales = Number(previousAffiliateOrders._sum.total ?? 0)

  const curProductsSold = currentDistinctProducts.length
  const prevProductsSold = previousDistinctProducts.length

  // Conversion rate: orders / page views
  const curConversionRate =
    currentPageViews > 0
      ? (curOrderCount / currentPageViews) * 100
      : 0
  const prevConversionRate =
    previousPageViews > 0
      ? (prevOrderCount / previousPageViews) * 100
      : 0

  const curReturnRate =
    currentTotalCustomers.length > 0
      ? (Number(currentReturnCustomers[0]?.cnt ?? 0) /
          currentTotalCustomers.length) *
        100
      : 0
  const prevReturnRate =
    previousTotalCustomers.length > 0
      ? (Number(previousReturnCustomers[0]?.cnt ?? 0) /
          previousTotalCustomers.length) *
        100
      : 0

  function pctChange(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 100)
  }

  return {
    totalSales: {
      value: curSales,
      change: pctChange(curSales, prevSales),
    },
    totalOrders: {
      value: curOrderCount,
      change: pctChange(curOrderCount, prevOrderCount),
    },
    avgOrderValue: {
      value: Math.round(curAOV),
      change: pctChange(curAOV, prevAOV),
    },
    productsSold: {
      value: curProductsSold,
      change: pctChange(curProductsSold, prevProductsSold),
    },
    affiliateSales: {
      value: curAffSales,
      change: pctChange(curAffSales, prevAffSales),
    },
    retentionRate: {
      value: Math.round(curReturnRate * 10) / 10,
      change: pctChange(curReturnRate, prevReturnRate),
    },
    conversionRate: {
      value: Math.round(curConversionRate * 10) / 10,
      change: pctChange(curConversionRate, prevConversionRate),
    },
  }
}

export async function getCategorySalesChart(
  range: DateRange,
  filterBranchId?: string | null,
) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const scopedBranchId =
    user.role === "ADMIN" ? user.branchId : filterBranchId

  const items = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        status: "DELIVERED",
        ...branchFilter(scopedBranchId),
      },
    },
    select: {
      quantity: true,
      total: true,
      variant: {
        select: {
          product: {
            select: {
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  const categoryMap = new Map<
    string,
    { id: string; name: string; units: number; revenue: number }
  >()

  for (const item of items) {
    const cat = item.variant.product.category
    const existing = categoryMap.get(cat.id) ?? {
      id: cat.id,
      name: cat.name,
      units: 0,
      revenue: 0,
    }
    existing.units += item.quantity
    existing.revenue += Number(item.total)
    categoryMap.set(cat.id, existing)
  }

  return Array.from(categoryMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

export async function getTopProducts(
  range: DateRange,
  filterBranchId?: string | null,
) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const scopedBranchId =
    user.role === "ADMIN" ? user.branchId : filterBranchId

  const items = await db.orderItem.groupBy({
    by: ["variantId"],
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        status: "DELIVERED",
        ...branchFilter(scopedBranchId),
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  })

  const variantIds = items.map((i) => i.variantId)
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      sku: true,
      product: { select: { name: true } },
    },
  })

  const variantMap = new Map(variants.map((v) => [v.id, v]))

  return items.map((item) => {
    const v = variantMap.get(item.variantId)
    return {
      name: v?.product.name ?? "Unknown",
      sku: v?.sku ?? "",
      unitsSold: item._sum.quantity ?? 0,
      revenue: Number(item._sum.total ?? 0),
    }
  })
}

export async function getBranches() {
  await requireRole(["CENTRAL_ADMIN"])
  return db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  })
}

export async function getSalesTrendChart(
  range: DateRange,
  filterBranchId?: string | null,
) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const scopedBranchId =
    user.role === "ADMIN" ? user.branchId : filterBranchId

  // Auto-granularity: daily if ≤31 days, weekly if ≤90 days, monthly otherwise
  const durationMs = range.to.getTime() - range.from.getTime()
  const durationDays = durationMs / (1000 * 60 * 60 * 24)

  let truncFn: string
  if (durationDays <= 31) {
    truncFn = "day"
  } else if (durationDays <= 90) {
    truncFn = "week"
  } else {
    truncFn = "month"
  }

  const rows = await db.$queryRaw<
    Array<{ period: Date; revenue: number; orders: bigint }>
  >`
    SELECT
      date_trunc(${truncFn}, "createdAt") AS period,
      COALESCE(SUM("total"::numeric), 0) AS revenue,
      COUNT(*) AS orders
    FROM "Order"
    WHERE "createdAt" >= ${range.from}
      AND "createdAt" <= ${range.to}
      AND "status" = 'DELIVERED'
      ${scopedBranchId ? Prisma.sql`AND "branchId" = ${scopedBranchId}` : Prisma.empty}
    GROUP BY period
    ORDER BY period
  `

  return {
    granularity: truncFn as "day" | "week" | "month",
    data: rows.map((r) => ({
      period: r.period.toISOString(),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
  }
}

export async function getOrderStatusDistribution(
  range: DateRange,
  filterBranchId?: string | null,
) {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const scopedBranchId =
    user.role === "ADMIN" ? user.branchId : filterBranchId

  const result = await db.order.groupBy({
    by: ["status"],
    where: {
      createdAt: { gte: range.from, lte: range.to },
      ...branchFilter(scopedBranchId),
    },
    _count: true,
  })

  return result.map((r) => ({
    status: r.status,
    count: r._count,
  }))
}

export async function getBranchRevenueComparison(range: DateRange) {
  await requireRole(["CENTRAL_ADMIN"])

  const rows = await db.$queryRaw<
    Array<{ branchId: string; branchName: string; revenue: number; orders: bigint }>
  >`
    SELECT
      b."id" AS "branchId",
      b."name" AS "branchName",
      COALESCE(SUM(o."total"::numeric), 0) AS revenue,
      COUNT(o."id") AS orders
    FROM "Branch" b
    LEFT JOIN "Order" o
      ON o."branchId" = b."id"
      AND o."createdAt" >= ${range.from}
      AND o."createdAt" <= ${range.to}
      AND o."status" = 'DELIVERED'
    WHERE b."isActive" = true
    GROUP BY b."id", b."name"
    ORDER BY revenue DESC
  `

  return rows.map((r) => ({
    branchId: r.branchId,
    branchName: r.branchName,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }))
}
