"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { updateOrderStatus, cancelOrder } from "@/actions/order.actions"
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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useState, useTransition } from "react"
import { Loader2Icon } from "lucide-react"

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const

interface AdminOrderActionsProps {
  orderId: string
  currentStatus: string
}

export function AdminOrderActions({
  orderId,
  currentStatus,
}: AdminOrderActionsProps) {
  const router = useRouter()
  const t = useTranslations("adminOrders")
  const tOrders = useTranslations("orders")
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState("")

  function handleUpdate() {
    if (status === currentStatus && !note) return

    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        status as (typeof STATUSES)[number],
        note || undefined,
      )
      if (result && "error" in result) {
        toast.error(
          typeof result.error === "string" ? result.error : t("updateStatus"),
        )
        return
      }
      toast.success(t("updateStatus"))
      setNote("")
      router.refresh()
    })
  }

  function handleCancel() {
    if (!confirm(t("cancelConfirm"))) return

    startTransition(async () => {
      const result = await cancelOrder(orderId)
      if (result && "error" in result) {
        toast.error(
          typeof result.error === "string" ? result.error : t("cancelOrder"),
        )
        return
      }
      toast.success(t("cancelOrder"))
      router.refresh()
    })
  }

  const isCancelled = currentStatus === "CANCELLED"
  const isDelivered = currentStatus === "DELIVERED"
  const canCancel =
    !isCancelled && !isDelivered && currentStatus !== "SHIPPED"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("updateStatus")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{tOrders("status")}</Label>
          <Select
            value={status}
            onValueChange={setStatus}
            disabled={isCancelled || isDelivered}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
                <SelectItem key={s} value={s}>
                  {tOrders(`status_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("statusNote")}</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("statusNotePlaceholder")}
            rows={3}
            disabled={isCancelled || isDelivered}
          />
        </div>

        <Button
          onClick={handleUpdate}
          disabled={
            isPending ||
            isCancelled ||
            isDelivered ||
            (status === currentStatus && !note)
          }
          className="w-full"
        >
          {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {t("update")}
        </Button>

        {canCancel && (
          <>
            <Separator />
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
              className="w-full"
            >
              {isPending && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              {t("cancelOrder")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
