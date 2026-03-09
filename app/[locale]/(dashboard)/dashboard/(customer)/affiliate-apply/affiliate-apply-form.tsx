"use client"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { applyForAffiliate } from "@/actions/affiliate.actions"
import {
  affiliateApplicationSchema,
  type AffiliateApplicationValues,
} from "@/lib/validators/affiliate.schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"

interface AffiliateApplyFormProps {
  branches: { id: string; name: string; city: string }[]
  canReapply: boolean
}

export function AffiliateApplyForm({
  canReapply,
}: AffiliateApplyFormProps) {
  const router = useRouter()
  const t = useTranslations("affiliateApply")
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState("")

  const form = useForm<AffiliateApplicationValues>({
    resolver: zodResolver(affiliateApplicationSchema) as never,
    defaultValues: {
      payoutMethod: "MOBILE_MONEY",
      payoutPhone: "",
      motivation: "",
    },
  })

  function onSubmit(values: AffiliateApplicationValues) {
    setServerError("")
    startTransition(async () => {
      const result = await applyForAffiliate(values)
      if ("error" in result) {
        if (typeof result.error === "string") {
          setServerError(result.error)
        } else {
          toast.error(t("validationError"))
        }
        return
      }
      toast.success(t("applicationSubmitted"))
      router.push("/dashboard")
    })
  }

  if (!canReapply) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("reapplyWait")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t("formTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <FormField
              control={form.control}
              name="payoutPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payoutPhone")}</FormLabel>
                  <FormDescription>{t("payoutPhoneDescription")}</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="+237 6XX XXX XXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payoutMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payoutMethod")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled value="MOBILE_MONEY" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("motivation")}</FormLabel>
                  <FormDescription>{t("motivationDescription")}</FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={t("motivationPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {t("submit")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
