"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { updatePayoutPreference } from "@/actions/affiliate.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function PayoutPreferenceSelector({
  currentPreference,
}: {
  currentPreference: "MONTHLY" | "IMMEDIATE";
}) {
  const t = useTranslations("affiliate");
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await updatePayoutPreference({
        preference: value as "MONTHLY" | "IMMEDIATE",
      });
      if ("error" in result) {
        toast.error(
          typeof result.error === "string" ? result.error : t("error"),
        );
      } else {
        toast.success(t("preferenceUpdated"));
      }
    });
  }

  return (
    <div className="space-y-2">
      <Label>{t("payoutPreference")}</Label>
      <Select
        defaultValue={currentPreference}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MONTHLY">{t("preferenceMonthly")}</SelectItem>
          <SelectItem value="IMMEDIATE">{t("preferenceImmediate")}</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {currentPreference === "MONTHLY"
          ? t("monthlyDescription")
          : t("immediateDescription")}
      </p>
    </div>
  );
}
