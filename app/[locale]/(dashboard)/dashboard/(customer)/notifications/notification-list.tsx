"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { formatDistanceToNow } from "date-fns"
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notification.actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCheckIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  link: string | null
  createdAt: Date
}

const TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ORDER_UPDATE: "default",
  REPAIR_UPDATE: "secondary",
  COMMISSION: "default",
  SYSTEM: "outline",
  PROMOTION: "default",
  LOW_STOCK_ALERT: "secondary",
  AFFILIATE_APPLICATION: "secondary",
  GUARANTEE_EXPIRY: "outline",
}

export function NotificationList({
  notifications,
  page,
  totalPages,
}: {
  notifications: Notification[]
  page: number
  totalPages: number
}) {
  const t = useTranslations("notifications")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotification(id)
      router.refresh()
    })
  }

  if (notifications.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={isPending}
        >
          <CheckCheckIcon className="mr-1 size-4" />
          {t("markAllRead")}
        </Button>
      </div>

      <div className="divide-y">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-4 py-4 ${
              !n.isRead ? "bg-accent/20 -mx-4 px-4 rounded-md" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={TYPE_VARIANT[n.type] ?? "outline"} className="text-xs">
                  {t(`types.${n.type}`)}
                </Badge>
                {!n.isRead && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-1 font-medium">{n.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={isPending}
                  title={t("markRead")}
                >
                  <CheckCheckIcon className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(n.id)}
                disabled={isPending}
                title={t("delete")}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link href={`/dashboard/notifications?page=${page - 1}`}>
              <ChevronLeftIcon className="size-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link href={`/dashboard/notifications?page=${page + 1}`}>
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
