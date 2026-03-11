"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallback } from "react";

export function ActivityLogFilters({
  actions,
  entityTypes,
  currentAction,
  currentEntityType,
  currentStartDate,
  currentEndDate,
}: {
  actions: string[];
  entityTypes: string[];
  currentAction?: string;
  currentEntityType?: string;
  currentStartDate?: string;
  currentEndDate?: string;
}) {
  const t = useTranslations("adminActivityLog");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset to page 1 on filter change
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("?");
  }, [router]);

  const hasFilters =
    currentAction || currentEntityType || currentStartDate || currentEndDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("filters")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <Select
              value={currentAction ?? "all"}
              onValueChange={(v) =>
                updateFilter("action", v === "all" ? undefined : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filterByAction")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select
              value={currentEntityType ?? "all"}
              onValueChange={(v) =>
                updateFilter("entityType", v === "all" ? undefined : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filterByEntity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {entityTypes.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Input
              type="date"
              className="w-40"
              value={currentStartDate ?? ""}
              onChange={(e) =>
                updateFilter("startDate", e.target.value || undefined)
              }
              placeholder={t("startDate")}
            />
            <span className="pb-2 text-muted-foreground">—</span>
            <Input
              type="date"
              className="w-40"
              value={currentEndDate ?? ""}
              onChange={(e) =>
                updateFilter("endDate", e.target.value || undefined)
              }
              placeholder={t("endDate")}
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
