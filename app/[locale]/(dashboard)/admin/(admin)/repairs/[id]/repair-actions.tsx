"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { updateRepairStatus } from "@/actions/repair.actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"

const STATUSES = [
  "SUBMITTED",
  "DIAGNOSED",
  "IN_REPAIR",
  "READY",
  "RETURNED",
  "CLOSED",
] as const

interface AdminRepairActionsProps {
  ticketId: string
  currentStatus: string
}

export function AdminRepairActions({
  ticketId,
  currentStatus,
}: AdminRepairActionsProps) {
  const router = useRouter()
  const t = useTranslations("repairs")
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState("")

  function handleUpdate() {
    if (status === currentStatus && !note) return

    startTransition(async () => {
      const result = await updateRepairStatus(ticketId, { status, note })
      if ("error" in result) {
        toast.error(typeof result.error === "string" ? result.error : t("updateError"))
        return
      }
      toast.success(t("statusUpdated"))
      setNote("")
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("updateStatus")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("newStatus")}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("note")}</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
            rows={3}
          />
        </div>

        <Button
          onClick={handleUpdate}
          disabled={isPending || (status === currentStatus && !note)}
          className="w-full"
        >
          {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {t("updateStatus")}
        </Button>
      </CardContent>
    </Card>
  )
}
