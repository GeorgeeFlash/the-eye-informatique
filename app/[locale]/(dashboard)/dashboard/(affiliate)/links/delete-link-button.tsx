"use client"

import { useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { deleteAffiliateLink } from "@/actions/affiliate.actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { TrashIcon } from "lucide-react"

export function DeleteLinkButton({ linkId }: { linkId: string }) {
  const t = useTranslations("affiliate")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await deleteAffiliateLink(linkId)
      toast.success(t("linkDeleted"))
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      title={t("deleteLink")}
    >
      <TrashIcon className="size-4" />
    </Button>
  )
}
