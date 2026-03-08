"use client"

import { BellIcon } from "lucide-react"
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

// Placeholder notification items — will be replaced with real data once schema is seeded
const PLACEHOLDER_NOTIFICATIONS = [
  {
    id: "1",
    type: "ORDER",
    title: "Nouvelle commande",
    body: "Commande #1042 reçue — Samsung Galaxy A55",
    read: false,
    createdAt: "Il y a 5 min",
  },
  {
    id: "2",
    type: "REPAIR",
    title: "Ticket de réparation mis à jour",
    body: "REP-0098 — Diagnostic terminé",
    read: false,
    createdAt: "Il y a 1 h",
  },
  {
    id: "3",
    type: "AFFILIATE",
    title: "Nouvelle commission",
    body: "Commission de 2 500 XAF créditée",
    read: true,
    createdAt: "Hier",
  },
]

export function NotificationDropdown() {
  const unreadCount = PLACEHOLDER_NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <BellIcon className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              {unreadCount} nouvelles
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-72">
          <div className="p-1">
            {PLACEHOLDER_NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className={`rounded-md p-3 text-sm transition-colors hover:bg-accent cursor-pointer ${
                  !n.read ? "bg-accent/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-tight">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{n.createdAt}</span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
