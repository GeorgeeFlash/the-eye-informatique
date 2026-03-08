"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { TrashIcon } from "lucide-react"

export function DeleteDocButton({ docId }: { docId: string }) {
  const t = useTranslations("ai")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = await fetch(`/api/ai/knowledge-base/${docId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error(t("deleteError"))
        return
      }
      toast.success(t("documentDeleted"))
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      title={t("deleteDocument")}
    >
      <TrashIcon className="size-4" />
    </Button>
  )
}
