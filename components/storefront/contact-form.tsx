"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitContactForm } from "@/actions/contact.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2Icon } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string>();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGlobalError(undefined);

    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitContactForm({
        name: form.get("name") as string,
        email: form.get("email") as string,
        phone: (form.get("phone") as string) || undefined,
        subject: form.get("subject") as string,
        message: form.get("message") as string,
      });

      if (result.success) {
        setSuccess(true);
        return;
      }

      if (typeof result.error === "string") {
        setGlobalError(result.error);
      } else if (result.error) {
        setErrors(result.error as Record<string, string[]>);
      }
    });
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2Icon className="size-12 text-green-500" />
          <p className="text-lg font-medium">{t("success")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("formTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t("namePlaceholder")}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                placeholder={t("phonePlaceholder")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject")}</Label>
              <Input
                id="subject"
                name="subject"
                placeholder={t("subjectPlaceholder")}
                required
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              name="message"
              placeholder={t("messagePlaceholder")}
              rows={5}
              required
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message[0]}</p>
            )}
          </div>

          {globalError && (
            <p className="text-sm text-destructive">
              {globalError === "Too many submissions. Please try again later."
                ? t("rateLimited")
                : globalError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            {isPending ? t("sending") : t("send")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
