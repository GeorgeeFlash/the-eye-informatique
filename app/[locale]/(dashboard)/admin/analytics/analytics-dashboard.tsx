"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, DownloadIcon } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAnalyticsKPIs,
  getCategorySalesChart,
  getTopProducts,
} from "@/actions/analytics.actions"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import {
  DollarSignIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  PackageIcon,
  UsersIcon,
  GitBranchIcon,
} from "lucide-react"

type KPIs = Awaited<ReturnType<typeof getAnalyticsKPIs>>
type CategoryData = Awaited<ReturnType<typeof getCategorySalesChart>>
type TopProductData = Awaited<ReturnType<typeof getTopProducts>>

interface Props {
  role: string
  branchId: string | null
  branches: Array<{ id: string; name: string; city: string }>
}

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  units: { label: "Units", color: "var(--chart-2)" },
}

export function AnalyticsDashboard({ role, branchId, branches }: Props) {
  const t = useTranslations("analytics")
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(now))
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(now))
  const [filterBranch, setFilterBranch] = useState<string | null>(null)

  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryData>([])
  const [topProducts, setTopProducts] = useState<TopProductData>([])

  function loadData() {
    startTransition(async () => {
      const range = { from: dateFrom, to: dateTo }
      const brFilter = role === "CENTRAL_ADMIN" ? filterBranch : branchId

      const [kpiResult, catResult, prodResult] = await Promise.all([
        getAnalyticsKPIs(range, brFilter),
        getCategorySalesChart(range, brFilter),
        getTopProducts(range, brFilter),
      ])

      setKpis(kpiResult)
      setCategoryData(catResult)
      setTopProducts(prodResult)
    })
  }

  function handleExport() {
    const params = new URLSearchParams({
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
    })
    if (filterBranch) params.set("branchId", filterBranch)

    window.open(`/api/analytics/export?${params.toString()}`, "_blank")
    toast.success(t("exportStarted"))
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
              <Button variant="outline" size="sm" className="w-40 justify-start">
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
              <Button variant="outline" size="sm" className="w-40 justify-start">
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
              onValueChange={(v) =>
                setFilterBranch(v === "all" ? null : v)
              }
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      )}

      {/* Charts & Tables */}
      {kpis && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Sales Chart */}
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

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("topProducts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("product")}</TableHead>
                      <TableHead className="text-right">
                        {t("unitsSold")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("revenue")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.sku}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.sku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.unitsSold}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {!kpis && !isPending && (
        <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
          <TrendingUpIcon className="size-12" />
          <p>{t("selectDateRange")}</p>
        </div>
      )}
    </div>
  )
}
