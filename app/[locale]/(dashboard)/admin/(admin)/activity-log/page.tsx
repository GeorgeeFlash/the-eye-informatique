import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import {
  getActivityLogs,
  getActivityLogFilterOptions,
} from "@/actions/notification.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Locale } from "@/lib/constants";
import { ActivityLogFilters } from "./activity-log-filters";

export async function generateMetadata() {
  const t = await getTranslations("adminActivityLog");
  return { title: t("title") };
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"]);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const t = await getTranslations("adminActivityLog");
  const locale = (await getLocale()) as Locale;

  const [{ logs, totalPages, total }, filterOptions] = await Promise.all([
    getActivityLogs({
      action: params.action || undefined,
      entityType: params.entityType || undefined,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      page,
      pageSize: 50,
    }),
    getActivityLogFilterOptions(),
  ]);

  // Build search params string for pagination links
  const filterParams: Record<string, string> = {};
  if (params.action) filterParams.action = params.action;
  if (params.entityType) filterParams.entityType = params.entityType;
  if (params.startDate) filterParams.startDate = params.startDate;
  if (params.endDate) filterParams.endDate = params.endDate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("totalEntries", { count: total })}
        </p>
      </div>

      <ActivityLogFilters
        actions={filterOptions.actions}
        entityTypes={filterOptions.entityTypes}
        currentAction={params.action}
        currentEntityType={params.entityType}
        currentStartDate={params.startDate}
        currentEndDate={params.endDate}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("action")}</TableHead>
                <TableHead>{t("entity")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("noEntries")}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="text-sm font-medium">
                            {log.user.name ?? log.user.email}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {log.user.role}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("system")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.entityType ? (
                        <span className="text-sm">
                          {log.entityType}
                          {log.entityId && (
                            <span className="ml-1 font-mono text-xs text-muted-foreground">
                              {log.entityId.slice(-8)}
                            </span>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(log.createdAt, "dd/MM/yyyy HH:mm", locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?${new URLSearchParams({ ...filterParams, page: String(page - 1) }).toString()}`}
              >
                &larr;
              </Link>
            </Button>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?${new URLSearchParams({ ...filterParams, page: String(page + 1) }).toString()}`}
              >
                &rarr;
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
