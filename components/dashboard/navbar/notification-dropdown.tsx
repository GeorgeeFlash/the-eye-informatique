"use client"

import { BellIcon, CheckCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState, useTransition } from "react"
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from "@/actions/notification.actions"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

type Notification = {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  link: string | null
  createdAt: Date
}

export function NotificationDropdown() {
  const t = useTranslations("notifications")
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const [data, count] = await Promise.all([
        getNotifications({ pageSize: 10 }),
        getUnreadCount(),
      ])
      setNotifications(data.notifications as Notification[])
      setUnreadCount(count)
    }
    load()
  }, [])

  function handleClick(n: Notification) {
    if (!n.isRead) {
      startTransition(async () => {
        await markNotificationRead(n.id)
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      })
    }
    if (n.link) router.push(n.link)
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })))
      setUnreadCount(0)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("title")}>
          <BellIcon className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheckIcon className="mr-1 size-3" />
              {t("markAllRead")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-72">
          <div className="p-1">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t("empty")}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full rounded-md p-3 text-left text-sm transition-colors hover:bg-accent ${
                    !n.isRead ? "bg-accent/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{n.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{n.body}</p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => router.push("/dashboard/notifications")}
          >
            {t("viewAll")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
