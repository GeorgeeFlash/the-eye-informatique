import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  WrenchIcon,
  ArrowRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Locale } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("customerDashboard");
  return { title: t("welcome", { name: "" }).trim() };
}

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const t = await getTranslations("customerDashboard");
  const locale = (await getLocale()) as Locale;

  const now = new Date();
  const fourteenDaysFromNow = new Date(
    now.getTime() + 14 * 24 * 60 * 60 * 1000,
  );

  // Fetch customer data in parallel
  const [
    recentOrders,
    activeRepairs,
    guaranteeCards,
    affiliateProfile,
    totalOrders,
    expiringGuarantees,
  ] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { id: true } },
      },
    }),
    db.repairTicket.count({
      where: { userId: user.id, status: { notIn: ["CLOSED", "RETURNED"] } },
    }),
    db.guaranteeCard.count({
      where: { userId: user.id, expiresAt: { gt: now } },
    }),
    db.affiliateProfile.findUnique({
      where: { userId: user.id },
      select: { status: true, totalEarned: true },
    }),
    db.order.count({ where: { userId: user.id } }),
    // AC-M4.2-7: Guarantees expiring within 14 days
    db.guaranteeCard.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: now, lte: fourteenDaysFromNow },
      },
      select: {
        id: true,
        expiresAt: true,
        orderItem: {
          select: {
            variant: {
              select: { product: { select: { name: true } } },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("welcome", { name: user.name || t("customer") })}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalOrders")}
          value={totalOrders}
          icon={ShoppingCartIcon}
        />
        <StatCard
          title={t("activeRepairs")}
          value={activeRepairs}
          icon={WrenchIcon}
        />
        <StatCard
          title={t("activeGuarantees")}
          value={guaranteeCards}
          icon={ShieldCheckIcon}
        />
        <StatCard
          title={t("browseProducts")}
          value={t("shopNow")}
          icon={PackageIcon}
        />
      </div>

      {/* Guarantee Expiry Warnings — AC-M4.2-7 */}
      {expiringGuarantees.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">
                {t("guaranteeExpiryWarning")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringGuarantees.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {g.orderItem?.variant?.product?.name ?? t("product")}
                  </span>
                  <span className="text-muted-foreground">
                    {t("expiresOn", {
                      date: formatDate(g.expiresAt, "dd/MM/yyyy", locale),
                    })}
                  </span>
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
            <Link href="/dashboard/orders">
              {t("viewAll")}
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCartIcon className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t("noOrdersYet")}
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/products">{t("startShopping")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(order.createdAt, "dd/MM/yyyy", locale)}
                      <span>&middot;</span>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(order.total), locale)}
                    </span>
                    <OrderStatusBadge status={order.status} t={t} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Panel — only if user has affiliate profile */}
      {affiliateProfile && affiliateProfile.status !== "REJECTED" && (
        <Card
          className={affiliateProfile.status !== "APPROVED" ? "opacity-75" : ""}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("affiliatePanel")}</CardTitle>
              <AffiliateStatusBadge status={affiliateProfile.status} t={t} />
            </div>
            {affiliateProfile.status === "PENDING" && (
              <CardDescription>{t("affiliatePendingNotice")}</CardDescription>
            )}
            {affiliateProfile.status === "SUSPENDED" && (
              <CardDescription>{t("affiliateSuspendedNotice")}</CardDescription>
            )}
          </CardHeader>
          {affiliateProfile.status === "APPROVED" && (
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("totalEarnings")}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      Number(affiliateProfile.totalEarned),
                      locale,
                    )}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/earnings">
                    {t("viewDetails")}
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Affiliate CTA — show when user hasn't applied yet */}
      {!affiliateProfile && (
        <Card>
          <CardHeader>
            <CardTitle>{t("affiliatePanel")}</CardTitle>
            <CardDescription>{t("affiliateCta")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/affiliate-apply">
                {t("applyNow")}
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OrderStatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PENDING: "secondary",
    CONFIRMED: "default",
    PROCESSING: "default",
    SHIPPED: "default",
    DELIVERED: "outline",
    CANCELLED: "destructive",
  };

  return (
    <Badge variant={variants[status] ?? "secondary"} className="text-xs">
      {t(`status_${status}`)}
    </Badge>
  );
}

function AffiliateStatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    APPROVED: "default",
    PENDING: "secondary",
    SUSPENDED: "destructive",
    REJECTED: "destructive",
  };

  return (
    <Badge variant={variants[status] ?? "secondary"}>
      {t(`affiliateStatus_${status}`)}
    </Badge>
  );
}
