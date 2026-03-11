"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

type FeatureField = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  options: string[] | null;
};

interface Props {
  featureFields: FeatureField[];
}

export function FeatureFilters({ featureFields }: Props) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (fieldId: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      const key = `ff_${fieldId}`;
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of Array.from(params.keys())) {
      if (key.startsWith("ff_")) params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const hasActiveFilters = Array.from(searchParams.keys()).some((k) =>
    k.startsWith("ff_"),
  );

  if (featureFields.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("filterByFeatures")}</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto px-2 py-1 text-xs"
          >
            <XIcon className="mr-1 h-3 w-3" />
            {t("clearFilters")}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {featureFields.map((ff) => {
          const currentValue = searchParams.get(`ff_${ff.id}`) ?? "";

          if (ff.type === "DROPDOWN" && ff.options && ff.options.length > 0) {
            return (
              <div key={ff.id} className="min-w-35">
                <label className="text-xs text-muted-foreground mb-1 block">
                  {ff.name}
                </label>
                <Select
                  value={currentValue || "all"}
                  onValueChange={(v) =>
                    updateFilter(ff.id, v === "all" ? undefined : v)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {ff.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // TEXT & NUMBER: simple input with enter to apply
          return (
            <div key={ff.id} className="min-w-35">
              <label className="text-xs text-muted-foreground mb-1 block">
                {ff.name}
              </label>
              <Input
                type={ff.type === "NUMBER" ? "number" : "text"}
                className="h-8 text-xs"
                defaultValue={currentValue}
                placeholder={ff.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    updateFilter(ff.id, val || undefined);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
