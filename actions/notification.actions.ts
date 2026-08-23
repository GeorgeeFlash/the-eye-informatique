"use server"

import { db } from "@/server/db"
import { requireAuth, requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"
import type { NotificationType } from "@/lib/generated/prisma/client"
import { stripHtml } from "@/lib/sanitize"
import { logActivity } from "@/lib/activity-log"
import { inngest } from "@/server/inngest/client"

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

/* ─── Broadcast — Admin (M7.2) ──────────────────────────── */

export type BroadcastAudience =
  | "ALL_USERS"
  | "CUSTOMERS"
  | "AFFILIATES"
  | "BRANCH_STAFF"
  | "ALL_STAFF"

/** Build Prisma `where` filter for the target audience. */
function buildAudienceFilter(
  audience: BroadcastAudience,
  branchId?: string | null,
) {
  const base = { isActive: true }
  switch (audience) {
    case "ALL_USERS":
      return base
    case "CUSTOMERS":
      return { ...base, role: "CUSTOMER" as const }
    case "AFFILIATES":
      return {
        ...base,
        role: "AFFILIATE" as const,
        affiliateProfile: { status: "APPROVED" as const },
      }
    case "BRANCH_STAFF":
      return {
        ...base,
        branchId: branchId!,
        role: { in: ["STAFF", "ADMIN"] as const },
      }
    case "ALL_STAFF":
      return { ...base, role: { in: ["STAFF", "ADMIN"] as const } }
  }
}

export async function sendBroadcast({
  title,
  body,
  targetAudience = "ALL_USERS",
  branchId,
  sendEmailCopy = false,
  titleFr,
  bodyFr,
}: {
  title: string
  body: string
  targetAudience?: BroadcastAudience
  branchId?: string
  sendEmailCopy?: boolean
  titleFr?: string
  bodyFr?: string
}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const sanitizedTitle = stripHtml(title).trim()
  const sanitizedBody = stripHtml(body).trim()
  const sanitizedTitleFr = titleFr ? stripHtml(titleFr).trim() : ""
  const sanitizedBodyFr = bodyFr ? stripHtml(bodyFr).trim() : ""

  if (!sanitizedTitle || !sanitizedBody) {
    return { error: "Title and body are required" }
  }

  // Branch Admin can only target their own branch
  let effectiveBranchId = branchId
  if (admin.role === "ADMIN") {
    if (!admin.branchId) return { error: "No branch assigned" }
    // Branch Admin restricted to BRANCH_STAFF and AFFILIATES in their branch
    if (
      targetAudience !== "BRANCH_STAFF" &&
      targetAudience !== "AFFILIATES"
    ) {
      return { error: "Branch administrators can only broadcast to their branch staff or affiliates" }
    }
    effectiveBranchId = admin.branchId
  }

  // Resolve target audience with branch override for AFFILIATES when Branch Admin
  const audienceFilter =
    admin.role === "ADMIN" && targetAudience === "AFFILIATES"
      ? {
          isActive: true,
          role: "AFFILIATE" as const,
          affiliateProfile: {
            status: "APPROVED" as const,
            branchId: admin.branchId,
          },
        }
      : buildAudienceFilter(targetAudience, effectiveBranchId)

  // Get recipients with locale for i18n delivery
  const users = await db.user.findMany({
    where: audienceFilter,
    select: { id: true, email: true, preferredLocale: true },
  })

  if (users.length === 0) {
    return { error: "No recipients match the selected audience" }
  }

  // Create notifications in batch — deliver in user's preferred language
  await db.notification.createMany({
    data: users.map((u) => {
      const isFr =
        u.preferredLocale === "fr" && sanitizedTitleFr && sanitizedBodyFr
      return {
        userId: u.id,
        type: "SYSTEM" as NotificationType,
        title: isFr ? sanitizedTitleFr : sanitizedTitle,
        body: isFr ? sanitizedBodyFr : sanitizedBody,
      }
    }),
  })

  // Save broadcast record for history
  const broadcast = await db.broadcast.create({
    data: {
      senderId: admin.id,
      subject: sanitizedTitle,
      body: sanitizedBody,
      targetAudience,
      branchId: effectiveBranchId || null,
      recipientCount: users.length,
      emailCopySent: sendEmailCopy,
    },
  })

  // Queue email copies via Inngest if requested
  if (sendEmailCopy) {
    const CHUNK_SIZE = 20
    const events = users.map((u) => {
      const isFr =
        u.preferredLocale === "fr" && sanitizedTitleFr && sanitizedBodyFr
      return {
        id: `broadcast-email-${broadcast.id}-${u.id}`,
        name: "email/send",
        data: {
          to: u.email,
          subject: isFr ? sanitizedTitleFr : sanitizedTitle,
          template: "broadcast-notification",
          messageId: `broadcast-${broadcast.id}-${u.id}`,
          props: {
            subject: isFr ? sanitizedTitleFr : sanitizedTitle,
            body: isFr ? sanitizedBodyFr : sanitizedBody,
          },
        },
      }
    })

    for (let i = 0; i < events.length; i += CHUNK_SIZE) {
      const chunk = events.slice(i, i + CHUNK_SIZE)
      await inngest.send(chunk)
    }
  }

  logActivity({
    action: "BROADCAST_SENT",
    entityType: "Broadcast",
    entityId: "broadcast",
    metadata: {
      title: sanitizedTitle,
      targetAudience,
      branchId: effectiveBranchId,
      recipientCount: users.length,
      emailCopySent: sendEmailCopy,
    },
  })

  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true, recipientCount: users.length }
}

/* ─── Broadcast preview (recipient count) ─────────────── */

export async function estimateRecipientCount({
  targetAudience,
  branchId,
}: {
  targetAudience: BroadcastAudience
  branchId?: string
}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  let effectiveBranchId = branchId
  if (admin.role === "ADMIN") {
    if (!admin.branchId) return { count: 0 }
    effectiveBranchId = admin.branchId
  }

  const audienceFilter =
    admin.role === "ADMIN" && targetAudience === "AFFILIATES"
      ? {
          isActive: true,
          role: "AFFILIATE" as const,
          affiliateProfile: {
            status: "APPROVED" as const,
            branchId: admin.branchId,
          },
        }
      : buildAudienceFilter(targetAudience, effectiveBranchId)

  const count = await db.user.count({ where: audienceFilter })
  return { count }
}

/* ─── Broadcast History ─────────────────────────────────── */

export async function getBroadcastHistory({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  page?: number
  pageSize?: number
} = {}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const where =
    admin.role === "ADMIN" ? { senderId: admin.id } : {}

  const [broadcasts, total] = await Promise.all([
    db.broadcast.findMany({
      where,
      include: { sender: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.broadcast.count({ where }),
  ])

  return { broadcasts, total, totalPages: Math.ceil(total / pageSize) }
}

/* ─── Activity Logs — Admin access (M7.3) ────────────────── */

export async function getActivityLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  action,
  entityType,
  userId,
  startDate,
  endDate,
}: {
  page?: number
  pageSize?: number
  action?: string
  entityType?: string
  userId?: string
  startDate?: string
  endDate?: string
} = {}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const where: Record<string, unknown> = {}

  if (action) where.action = action
  if (entityType) where.entityType = entityType
  if (userId) where.userId = userId

  // Date range filter
  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {}
    if (startDate) createdAt.gte = new Date(startDate)
    if (endDate) createdAt.lte = new Date(endDate)
    where.createdAt = createdAt
  }

  // Branch Admin: only see logs from users in their branch
  if (admin.role === "ADMIN" && admin.branchId) {
    const branchUserIds = await db.user.findMany({
      where: { branchId: admin.branchId },
      select: { id: true },
    })
    where.userId = { in: branchUserIds.map((u) => u.id) }
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

/* ─── Activity Log filter options ────────────────────────── */

export async function getActivityLogFilterOptions() {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const [actions, entityTypes] = await Promise.all([
    db.activityLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    db.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ])

  return {
    actions: actions.map((a) => a.action),
    entityTypes: entityTypes.map((e) => e.entityType).filter(Boolean) as string[],
  }
}
