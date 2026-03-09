"use server"

import { db } from "@/server/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import type { NotificationType } from "@/lib/generated/prisma/client"

/* ─── Read ──────────────────────────────────────────────── */

export async function getNotifications({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  unreadOnly = false,
}: {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
} = {}) {
  const user = await requireAuth()

  const where = {
    userId: user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  }

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.notification.count({ where }),
  ])

  return { notifications, total, totalPages: Math.ceil(total / pageSize) }
}

export async function getUnreadCount() {
  const user = await requireAuth()
  return db.notification.count({
    where: { userId: user.id, isRead: false },
  })
}

/* ─── Mutations ─────────────────────────────────────────── */

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth()

  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  })

  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true }
}

export async function markAllNotificationsRead() {
  const user = await requireAuth()

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  })

  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const user = await requireAuth()

  await db.notification.deleteMany({
    where: { id: notificationId, userId: user.id },
  })

  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true }
}

/* ─── Create (internal helper — called from other actions/inngest) ─── */

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
}) {
  return db.notification.create({
    data: { userId, type, title, body, link },
  })
}
