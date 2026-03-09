"use server"

import { db } from "@/server/db"
import { requireAuth, requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import type { NotificationType } from "@/lib/generated/prisma/client"
import { stripHtml } from "@/lib/sanitize"

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

/* ─── Broadcast — Central Admin only (M7.1) ─────────────── */

export async function sendBroadcast({
  title,
  body,
}: {
  title: string
  body: string
}) {
  await requireRole(["CENTRAL_ADMIN"])

  const sanitizedTitle = stripHtml(title).trim()
  const sanitizedBody = stripHtml(body).trim()

  if (!sanitizedTitle || !sanitizedBody) {
    return { error: "Title and body are required" }
  }

  // Get all active users
  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true },
  })

  // Create notifications in batch
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "SYSTEM" as NotificationType,
      title: sanitizedTitle,
      body: sanitizedBody,
    })),
  })

  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true, recipientCount: users.length }
}

/* ─── Activity Logs — Central Admin only (M7.3) ──────────── */

export async function getActivityLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  action,
}: {
  page?: number
  pageSize?: number
  action?: string
} = {}) {
  await requireRole(["CENTRAL_ADMIN"])

  const where = {
    ...(action && { action }),
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
  ])

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
