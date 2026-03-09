"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { sendBroadcast } from "@/actions/notification.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

export function BroadcastForm() {
  const t = useTranslations("adminBroadcasts")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  function handleSend() {
    if (!title.trim() || !body.trim()) return

    startTransition(async () => {
      const result = await sendBroadcast({ title, body })
      if (result && "error" in result) {
        toast.error(t("error"))
        return
      }
      toast.success(
        result && "recipientCount" in result
          ? `${t("sent")} (${t("recipientCount", { count: result.recipientCount })})`
          : t("sent"),
      )
      setTitle("")
      setBody("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("titleLabel")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("bodyLabel")}</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("bodyPlaceholder")}
          rows={5}
          disabled={isPending}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={isPending || !title.trim() || !body.trim()}
      >
        {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
        {isPending ? t("sending") : t("send")}
      </Button>
    </div>
  )
}
