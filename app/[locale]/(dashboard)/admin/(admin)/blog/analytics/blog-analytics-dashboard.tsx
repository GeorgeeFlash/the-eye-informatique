"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format, startOfYear, endOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBlogKPIs,
  getArticleViewsChart,
  getTopArticles,
  getArticlesByTagChart,
} from "@/actions/blog.actions";
import { formatDate } from "@/lib/utils";
import { FileTextIcon, EyeIcon, BarChart3Icon, ClockIcon } from "lucide-react";

type KPIs = Awaited<ReturnType<typeof getBlogKPIs>>;
type ViewsData = Awaited<ReturnType<typeof getArticleViewsChart>>;
type TopArticleData = Awaited<ReturnType<typeof getTopArticles>>;
type TagData = Awaited<ReturnType<typeof getArticlesByTagChart>>;

const viewsChartConfig: ChartConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
};

const tagChartConfig: ChartConfig = {
  count: { label: "Articles", color: "var(--chart-2)" },
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "var(--chart-3)",
  PENDING_REVIEW: "var(--chart-4)",
  PUBLISHED: "var(--chart-1)",
  ARCHIVED: "var(--chart-5)",
};

export function BlogAnalyticsDashboard() {
  const t = useTranslations("blogAnalytics");
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(startOfYear(now));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(now));

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [viewsData, setViewsData] = useState<ViewsData>([]);
  const [topArticles, setTopArticles] = useState<TopArticleData>([]);
  const [tagData, setTagData] = useState<TagData>([]);

  function loadData() {
    startTransition(async () => {
      const range = { from: dateFrom, to: dateTo };

      const [kpiResult, viewsResult, topResult, tagResult] = await Promise.all([
        getBlogKPIs(range),
        getArticleViewsChart(range),
        getTopArticles(range),
        getArticlesByTagChart(range),
      ]);

      setKpis(kpiResult);
      setViewsData(viewsResult);
      setTopArticles(topResult);
      setTagData(tagResult);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

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

        <Button onClick={loadData} disabled={isPending}>
          {isPending ? t("loading") : t("loadData")}
        </Button>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("totalPublished")}
            value={kpis.totalPublished}
            icon={FileTextIcon}
          />
          <StatCard
            title={t("totalViews")}
            value={kpis.totalViews}
            icon={EyeIcon}
          />
          <StatCard
            title={t("avgViews")}
            value={kpis.avgViewsPerArticle}
            icon={BarChart3Icon}
          />
          <StatCard
            title={t("pendingReview")}
            value={kpis.pendingReview}
            icon={ClockIcon}
          />
        </div>
      )}

      {/* Charts */}
      {kpis && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Views over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("viewsOverTime")}</CardTitle>
            </CardHeader>
            <CardContent>
              {viewsData.length > 0 ? (
                <ChartContainer
                  config={viewsChartConfig}
                  className="h-72 w-full"
                >
                  <AreaChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      fill="var(--color-views)"
                      fillOpacity={0.3}
                      stroke="var(--color-views)"
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

          {/* Articles by tag */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("articlesByTag")}</CardTitle>
            </CardHeader>
            <CardContent>
              {tagData.length > 0 ? (
                <ChartContainer config={tagChartConfig} className="h-72 w-full">
                  <BarChart data={tagData} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="tag"
                      type="category"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("noData")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("statusBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kpis.statusBreakdown.length > 0 ? (
                <ChartContainer
                  config={Object.fromEntries(
                    kpis.statusBreakdown.map((s) => [
                      s.status,
                      {
                        label: s.status,
                        color: STATUS_COLORS[s.status] ?? "var(--chart-3)",
                      },
                    ]),
                  )}
                  className="mx-auto h-64 w-full max-w-xs"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={kpis.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {kpis.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? "var(--chart-3)"}
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

          {/* Top articles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("topArticles")}</CardTitle>
            </CardHeader>
            <CardContent>
              {topArticles.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("articleTitle")}</TableHead>
                      <TableHead>{t("author")}</TableHead>
                      <TableHead className="text-right">{t("views")}</TableHead>
                      <TableHead>{t("published")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topArticles.map((a) => (
                      <TableRow key={a.slug}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{a.title}</p>
                            {a.tags.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {a.tags.map((t) => t.name).join(", ")}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.author?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {a.viewCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.publishedAt ? formatDate(a.publishedAt) : "—"}
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
    </div>
  );
}
