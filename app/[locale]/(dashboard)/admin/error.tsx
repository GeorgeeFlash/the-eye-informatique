"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import * as Sentry from "@sentry/nextjs";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("adminError");
  const isAccessDenied =
    error.message === "Access denied" ||
    error.message === "Account is deactivated";

  useEffect(() => {
    if (!isAccessDenied) {
      Sentry.captureException(error);
    }
  }, [error, isAccessDenied]);

  if (isAccessDenied) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("accessDenied")}</CardTitle>
            <CardDescription>{t("accessDeniedDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">{t("goToDashboard")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{t("somethingWentWrong")}</CardTitle>
          <CardDescription>
            {t("somethingWentWrongDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>{t("tryAgain")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
