"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [affiliate, setAffiliate] = useState(false);
  const locale = useLocale();
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col items-center gap-4">
      <SignUp
        forceRedirectUrl={
          affiliate
            ? `/${locale}/complete-registration?affiliate=true`
            : `/${locale}/complete-registration`
        }
      />
      <div className="flex items-center gap-2">
        <Switch
          id="affiliate-toggle"
          checked={affiliate}
          onCheckedChange={setAffiliate}
        />
        <Label htmlFor="affiliate-toggle" className="cursor-pointer text-sm">
          {t("registerAsAffiliate")}
        </Label>
      </div>
    </div>
  );
}
