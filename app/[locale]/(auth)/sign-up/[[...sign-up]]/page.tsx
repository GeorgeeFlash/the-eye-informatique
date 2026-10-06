"use client";

import { useState, Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SignUpBenefits } from "@/components/auth/sign-up-benefits";

function SignUpContent() {
  const [affiliate, setAffiliate] = useState(false);
  const locale = useLocale();
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get("redirect_url");
  const source = searchParams.get("source");
  const isCheckoutSource =
    source === "checkout" ||
    (typeof redirectUrl === "string" && redirectUrl.includes("checkout"));

  // Build target redirect URL preserving any post-registration destination
  const baseTarget = `/${locale}/complete-registration`;
  const params = new URLSearchParams();
  if (affiliate) params.set("affiliate", "true");
  if (redirectUrl) params.set("redirect_url", redirectUrl);

  const finalRedirectUrl = params.toString()
    ? `${baseTarget}?${params.toString()}`
    : baseTarget;

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left column: Benefits & Incentives */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <SignUpBenefits isCheckoutSource={isCheckoutSource} />
        </div>

        {/* Right column: Clerk Sign Up Form */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <SignUp forceRedirectUrl={finalRedirectUrl} />

            {/* Affiliate Toggle */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/80 px-4 py-2.5 shadow-sm">
              <Switch
                id="affiliate-toggle"
                checked={affiliate}
                onCheckedChange={setAffiliate}
              />
              <Label
                htmlFor="affiliate-toggle"
                className="cursor-pointer text-xs sm:text-sm font-medium text-foreground select-none"
              >
                {t("registerAsAffiliate")}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
