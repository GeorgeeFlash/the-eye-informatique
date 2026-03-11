"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/dashboard/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAnalyticsKPIs,
  getCategorySalesChart,
  getTopProducts,
  getSalesTrendChart,
  getOrderStatusDistribution,
  getBranchRevenueComparison,
} from "@/actions/analytics.actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  DollarSignIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  PackageIcon,
  UsersIcon,
  GitBranchIcon,
  PercentIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

type KPIs = Awaited<ReturnType<typeof getAnalyticsKPIs>>;
type CategoryData = Awaited<ReturnType<typeof getCategorySalesChart>>;
type TopProductData = Awaited<ReturnType<typeof getTopProducts>>;
type SalesTrend = Awaited<ReturnType<typeof getSalesTrendChart>>;
type OrderStatusData = Awaited<ReturnType<typeof getOrderStatusDistribution>>;
type BranchComparison = Awaited<ReturnType<typeof getBranchRevenueComparison>>;

type TopProduct = TopProductData[number];

interface Props {
  role: string;
  branchId: string | null;
  branches: Array<{ id: string; name: string; city: string }>;
}

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  units: { label: "Units", color: "var(--chart-2)" },
  orders: { label: "Orders", color: "var(--chart-3)" },
};

const STATUS_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "hsl(var(--muted-foreground))",
];

export function AnalyticsDashboard({ role, branchId, branches }: Props) {
  const t = useTranslations("analytics");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(now));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(now));
  const [filterBranch, setFilterBranch] = useState<string | null>(null);

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData>([]);
  const [topProducts, setTopProducts] = useState<TopProductData>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusData>([]);
  const [branchComparison, setBranchComparison] = useState<BranchComparison>(
    [],
  );

  const topProductColumns: ColumnDef<TopProduct>[] = [
    {
      accessorKey: "name",
      header: t("product"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      ),
    },
    {
      accessorKey: "unitsSold",
      header: () => <span className="text-right block">{t("unitsSold")}</span>,
      cell: ({ row }) => <p className="text-right">{row.original.unitsSold}</p>,
    },
    {
      accessorKey: "revenue",
      header: () => <span className="text-right block">{t("revenue")}</span>,
      cell: ({ row }) => (
        <p className="text-right">{formatCurrency(row.original.revenue)}</p>
      ),
    },
  ];

  function loadData() {
    startTransition(async () => {
      const range = { from: dateFrom, to: dateTo };
      const brFilter = role === "CENTRAL_ADMIN" ? filterBranch : branchId;

      const promises: [
        ReturnType<typeof getAnalyticsKPIs>,
        ReturnType<typeof getCategorySalesChart>,
        ReturnType<typeof getTopProducts>,
        ReturnType<typeof getSalesTrendChart>,
        ReturnType<typeof getOrderStatusDistribution>,
        Promise<BranchComparison>,
      ] = [
        getAnalyticsKPIs(range, brFilter),
        getCategorySalesChart(range, brFilter),
        getTopProducts(range, brFilter),
        getSalesTrendChart(range, brFilter),
        getOrderStatusDistribution(range, brFilter),
        role === "CENTRAL_ADMIN"
          ? getBranchRevenueComparison(range)
          : Promise.resolve([]),
      ];

      const [
        kpiResult,
        catResult,
        prodResult,
        trendResult,
        statusResult,
        branchResult,
      ] = await Promise.all(promises);

      setKpis(kpiResult);
      setCategoryData(catResult);
      setTopProducts(prodResult);
      setSalesTrend(trendResult);
      setOrderStatus(statusResult);
      setBranchComparison(branchResult);
    });
  }

  function handleExport() {
    const params = new URLSearchParams({
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
    });
    if (filterBranch) params.set("branchId", filterBranch);

    window.open(`/api/analytics/export?${params.toString()}`, "_blank");
    toast.success(t("exportStarted"));
  }

  function handleCategoryClick(categoryId: string) {
    router.push(`/admin/inventory?categoryId=${categoryId}`);
  }

  // Build PieChart config dynamically
  const orderStatusConfig: ChartConfig = Object.fromEntries(
    orderStatus.map((s, i) => [
      s.status,
      { label: s.status, color: STATUS_COLORS[i % STATUS_COLORS.length] },
    ]),
  );

  // Branch comparison chart config
  const branchChartConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
    orders: { label: "Orders", color: "var(--chart-2)" },
  };

  // Format sales trend X-axis label
  function formatTrendLabel(iso: string, granularity: string) {
    const d = new Date(iso);
    if (granularity === "day") return format(d, "MMM dd");
    if (granularity === "week") return format(d, "MMM dd");
    return format(d, "MMM yyyy");
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("from")}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-40 justify-start"
              >
                <CalendarIcon className="mr-2 size-4" />
                {format(dateFrom, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => d && setDateFrom(d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("to")}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-40 justify-start"
              >
                <CalendarIcon className="mr-2 size-4" />
                {format(dateTo, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => d && setDateTo(d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {role === "CENTRAL_ADMIN" && branches.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {t("branch")}
            </label>
            <Select
              value={filterBranch ?? "all"}
              onValueChange={(v) => setFilterBranch(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allBranches")}</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — {b.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={loadData} disabled={isPending}>
          {isPending ? t("loading") : t("loadData")}
        </Button>

        {kpis && (
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="mr-2 size-4" />
            {t("export")}
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("totalSales")}
            value={formatCurrency(kpis.totalSales.value)}
            icon={DollarSignIcon}
            trend={{
              value: kpis.totalSales.change,
              positive: kpis.totalSales.change >= 0,
            }}
          />
          <StatCard
            title={t("totalOrders")}
            value={kpis.totalOrders.value}
            icon={ShoppingCartIcon}
            trend={{
              value: kpis.totalOrders.change,
              positive: kpis.totalOrders.change >= 0,
            }}
          />
          <StatCard
            title={t("avgOrderValue")}
            value={formatCurrency(kpis.avgOrderValue.value)}
            icon={TrendingUpIcon}
            trend={{
              value: kpis.avgOrderValue.change,
              positive: kpis.avgOrderValue.change >= 0,
            }}
          />
          <StatCard
            title={t("productsSold")}
            value={kpis.productsSold.value}
            icon={PackageIcon}
            trend={{
              value: kpis.productsSold.change,
              positive: kpis.productsSold.change >= 0,
            }}
          />
          <StatCard
            title={t("affiliateSales")}
            value={formatCurrency(kpis.affiliateSales.value)}
            icon={GitBranchIcon}
            trend={{
              value: kpis.affiliateSales.change,
              positive: kpis.affiliateSales.change >= 0,
            }}
          />
          <StatCard
            title={t("retentionRate")}
            value={`${kpis.retentionRate.value}%`}
            icon={UsersIcon}
            trend={{
              value: kpis.retentionRate.change,
              positive: kpis.retentionRate.change >= 0,
            }}
          />
          <StatCard
            title={t("conversionRate")}
            value={`${kpis.conversionRate.value}%`}
            icon={PercentIcon}
            trend={{
              value: kpis.conversionRate.change,
              positive: kpis.conversionRate.change >= 0,
            }}
          />
        </div>
      )}

      {/* Sales Trend + Order Status */}
      {kpis && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Trend (AreaChart) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("salesTrend")}</CardTitle>
            </CardHeader>
            <CardContent>
              {salesTrend && salesTrend.data.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <AreaChart data={salesTrend.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={(v) =>
                        formatTrendLabel(v, salesTrend.granularity)
                      }
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="var(--color-orders)"
                      fill="var(--color-orders)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution (PieChart) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("orderStatusBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderStatus.length > 0 ? (
                <ChartContainer
                  config={orderStatusConfig}
                  className="mx-auto h-72 w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Pie
                      data={orderStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {orderStatus.map((entry, idx) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[idx % STATUS_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Sales + Top Products */}
      {kpis && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Sales Chart (clickable) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("salesByCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={4}
                      className="cursor-pointer"
                      onClick={(_data, index) => {
                        const item = categoryData[index];
                        if (item) handleCategoryClick(item.id);
                      }}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Products DataTable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("topProducts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={topProductColumns}
                data={topProducts}
                searchKey="name"
                searchPlaceholder={t("searchProduct")}
                emptyMessage={t("noData")}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Comparison (Central Admin only) */}
      {kpis && role === "CENTRAL_ADMIN" && branchComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("branchComparison")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={branchChartConfig} className="h-72 w-full">
              <BarChart data={branchComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="branchName"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!kpis && !isPending && (
        <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
          <TrendingUpIcon className="size-12" />
          <p>{t("selectDateRange")}</p>
        </div>
      )}
    </div>
  );
}
