"use server"

import { db } from "@/server/db"
import { getCurrentUser } from "@/lib/auth"
import { Prisma } from "@/lib/generated/prisma/client"

/**
 * Log an activity. Called from server actions & API routes.
 * Fire-and-forget — errors are silently caught to avoid disrupting the main flow.
 */
export async function logActivity({
  action,
  entityType,
  entityId,
  metadata,
}: {
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const user = await getCurrentUser()

    await db.activityLog.create({
      data: {
        userId: user?.id ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    })
  } catch {
    // Activity logging is non-critical — never break the caller
  }
}
