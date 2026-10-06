"use client";

import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SignUpBenefits } from "@/components/auth/sign-up-benefits";

function SignInContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get("redirect_url") || `/${locale}`;
  const source = searchParams.get("source");
  const isCheckoutSource =
    source === "checkout" ||
    (typeof redirectUrl === "string" && redirectUrl.includes("checkout"));

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left column: Benefits & Perks */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <SignUpBenefits isCheckoutSource={isCheckoutSource} />
        </div>

        {/* Right column: Clerk Sign In Form */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md flex flex-col items-center gap-4">
            <SignIn forceRedirectUrl={redirectUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
