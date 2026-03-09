import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { getTranslations, getLocale } from "next-intl/server"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PackageIcon,
  ShoppingCartIcon,
  WrenchIcon,
  ArrowRightIcon,
  ClockIcon,
  UsersIcon,
  BuildingIcon,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const t = await getTranslations("adminDashboard")
  const locale = await getLocale() as "en" | "fr"

  const isCentralAdmin = user.role === "CENTRAL_ADMIN"
  const branchFilter = isCentralAdmin ? {} : { branchId: user.branchId! }

  // Fetch admin KPIs in parallel
  const [orderCount, pendingOrders, openRepairs, totalProducts, totalUsers, recentOrders, branches] =
    await Promise.all([
      db.order.count({ where: branchFilter }),
      db.order.count({ where: { ...branchFilter, status: "PENDING" } }),
      db.repairTicket.count({
        where: { ...branchFilter, status: { notIn: ["CLOSED", "RETURNED"] } },
      }),
      db.product.count({ where: isCentralAdmin ? {} : { variants: { some: { stockByBranch: { some: { branchId: user.branchId! } } } } } }),
      isCentralAdmin ? db.user.count({ where: { isActive: true } }) : Promise.resolve(0),
      db.order.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      isCentralAdmin
        ? db.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, city: true } })
        : Promise.resolve([]),
    ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isCentralAdmin ? t("centralTitle") : t("branchTitle")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalOrders")}
          value={orderCount}
          icon={ShoppingCartIcon}
        />
        <StatCard
          title={t("pendingOrders")}
          value={pendingOrders}
          icon={ClockIcon}
        />
        <StatCard
          title={t("openRepairs")}
          value={openRepairs}
          icon={WrenchIcon}
        />
        <StatCard
          title={isCentralAdmin ? t("totalUsers") : t("totalProducts")}
          value={isCentralAdmin ? totalUsers : totalProducts}
          icon={isCentralAdmin ? UsersIcon : PackageIcon}
        />
      </div>

      {/* Central Admin: Branch Overview */}
      {isCentralAdmin && branches.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("branches")}</CardTitle>
              <CardDescription>{t("branchesDesc")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/branches">
                {t("manage")}
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">{branch.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("recentOrders")}</CardTitle>
            <CardDescription>{t("recentOrdersDesc")}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              {t("viewAll")}
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{order.user?.name || order.user?.email}</span>
                      <span>&middot;</span>
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(order.createdAt, "dd/MM/yyyy", locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(order.total), locale)}
                    </span>
                    <Badge
                      variant={order.status === "PENDING" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
