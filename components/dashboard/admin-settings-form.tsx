"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSetting } from "@/actions/settings.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AdminSettingsFormProps {
  defaults: {
    interCityShippingFee: number;
    installmentCount: number;
  };
}

export function AdminSettingsForm({ defaults }: AdminSettingsFormProps) {
  const t = useTranslations("adminSettings");
  const [isPending, startTransition] = useTransition();

  const [interCityShippingFee, setInterCityShippingFee] = useState(
    defaults.interCityShippingFee,
  );
  const [installmentCount, setInstallmentCount] = useState(
    defaults.installmentCount,
  );

  function handleSave() {
    startTransition(async () => {
      try {
        await Promise.all([
          updateSetting("interCityShippingFee", interCityShippingFee),
          updateSetting("installmentCount", installmentCount),
        ]);
        toast.success(t("saved"));
      } catch {
        toast.error(t("saveError"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("storeConfiguration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="interCityShippingFee">
            {t("interCityShippingFee")}
          </Label>
          <Input
            id="interCityShippingFee"
            type="number"
            min={0}
            value={interCityShippingFee}
            onChange={(e) =>
              setInterCityShippingFee(Number(e.target.value) || 0)
            }
          />
          <p className="text-muted-foreground text-sm">
            {t("interCityShippingFeeHint")}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="installmentCount">{t("installmentCount")}</Label>
          <Input
            id="installmentCount"
            type="number"
            min={2}
            max={12}
            value={installmentCount}
            onChange={(e) => setInstallmentCount(Number(e.target.value) || 2)}
          />
          <p className="text-muted-foreground text-sm">
            {t("installmentCountHint")}
          </p>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
