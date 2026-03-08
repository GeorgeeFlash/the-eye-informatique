"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { requestPayout } from "@/actions/affiliate.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function PayoutButton() {
  const t = useTranslations("affiliate")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await requestPayout()
      if ("error" in result) {
        toast.error(result.error as string)
      } else {
        toast.success(t("payoutRequested"))
        router.refresh()
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {t("requestPayout")}
    </Button>
  )
}
