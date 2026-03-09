"use client"

import { useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  affiliateLinkSchema,
  type AffiliateLinkValues,
} from "@/lib/validators/affiliate.schema"
import { createAffiliateLink } from "@/actions/affiliate.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

export function CreateLinkForm() {
  const t = useTranslations("affiliate")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<AffiliateLinkValues>({
    resolver: zodResolver(affiliateLinkSchema),
    defaultValues: { targetUrl: "", code: "" },
  })

  function onSubmit(values: AffiliateLinkValues) {
    startTransition(async () => {
      const result = await createAffiliateLink(values)
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : t("linkError"))
      } else {
        toast.success(t("linkCreated"))
        form.reset()
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("createLink")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="targetUrl">{t("targetUrl")}</Label>
            <Input
              id="targetUrl"
              {...form.register("targetUrl")}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">{t("code")}</Label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="my-link"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            <PlusIcon className="mr-2 size-4" />
            {t("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
