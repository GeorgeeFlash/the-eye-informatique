import { requireRole } from "@/lib/auth";
import { db } from "@/server/db";
import { getTranslations, getLocale } from "next-intl/server";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PackageIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  ClockIcon,
  UsersIcon,
  BuildingIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Locale } from "@/lib/constants";
import { getLowStockProducts } from "@/actions/product.actions";

export default async function AdminDashboardPage() {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("adminDashboard");
  const locale = (await getLocale()) as Locale;

  const isCentralAdmin = user.role === "CENTRAL_ADMIN";
  const branchFilter = isCentralAdmin ? {} : { branchId: user.branchId! };

  // Fetch admin KPIs in parallel
  const [
    orderCount,
    pendingOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    branches,
    lowStockProducts,
  ] = await Promise.all([
    db.order.count({ where: branchFilter }),
    db.order.count({ where: { ...branchFilter, status: "PENDING" } }),
    db.product.count({
      where: isCentralAdmin
        ? {}
        : {
            variants: {
              some: { stockByBranch: { some: { branchId: user.branchId! } } },
            },
          },
    }),
    isCentralAdmin
      ? db.user.count({ where: { isActive: true } })
      : Promise.resolve(0),
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
      ? db.branch.findMany({
          where: { isActive: true },
          select: { id: true, name: true, city: true },
        })
      : Promise.resolve([]),
    getLowStockProducts(isCentralAdmin ? undefined : user.branchId!),
  ]);

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
          tone="blue"
        />
        <StatCard
          title={t("pendingOrders")}
          value={pendingOrders}
          icon={ClockIcon}
          tone="amber"
        />
        <StatCard
          title={isCentralAdmin ? t("totalUsers") : t("totalProducts")}
          value={isCentralAdmin ? totalUsers : totalProducts}
          icon={isCentralAdmin ? UsersIcon : PackageIcon}
          tone="indigo"
        />
      </div>

      {/* Central Admin: Branch Overview */}
      {isCentralAdmin && branches.length > 0 && (
        <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg font-bold">{t("branches")}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">{t("branchesDesc")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/10" asChild>
              <Link href="/admin/branches">
                {t("manage")}
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BuildingIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{branch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {branch.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-destructive/20 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangleIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-destructive">{t("lowStockAlerts")}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {t("lowStockAlertsDesc", { count: lowStockProducts.length })}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="font-semibold text-destructive hover:bg-destructive/10" asChild>
              <Link href="/admin/products">
                {t("viewAll")}
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 10).map((record) => (
                <Link
                  key={`${record.variantId}-${record.branchId}`}
                  href={`/admin/products/${record.variant.product.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-destructive/40 hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {record.variant.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("sku")}: {record.variant.sku}
                      {isCentralAdmin && (
                        <>
                          <span className="mx-1">&middot;</span>
                          {record.branch.name}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="destructive" className="font-bold text-xs">
                    {record.stock} / {record.lowStockThreshold}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg font-bold">{t("recentOrders")}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{t("recentOrdersDesc")}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/10" asChild>
            <Link href="/admin/orders">
              {t("viewAll")}
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
              {t("noOrders")}
            </p>
          ) : (
            <div className="space-y-2.5">
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
                      variant={
                        order.status === "PENDING" ? "secondary" : "default"
                      }
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
  );
}
