import { inngest } from "../client"
import { db } from "@/server/db"
import { ACTIVITY_LOG_RETENTION_DAYS } from "@/lib/constants"

const PAGE_VIEW_RETENTION_DAYS = 90

// M7.3 — Weekly activity log cleanup (retain last 90 days)
export const activityLogCleanup = inngest.createFunction(
  { id: "activity-log-cleanup", concurrency: { limit: 1 } },
  { cron: "0 2 * * 0" }, // every Sunday at 02:00
  async ({ step }) => {
    const result = await step.run("delete-old-logs", async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - ACTIVITY_LOG_RETENTION_DAYS)

      const { count } = await db.activityLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      })

      return { deleted: count }
    })

    return result
  },
)

// M8 — Weekly product page view cleanup (retain last 90 days)
export const productPageViewCleanup = inngest.createFunction(
  { id: "product-page-view-cleanup", concurrency: { limit: 1 } },
  { cron: "0 3 * * 0" }, // every Sunday at 03:00
  async ({ step }) => {
    const result = await step.run("delete-old-page-views", async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - PAGE_VIEW_RETENTION_DAYS)

      const { count } = await db.productPageView.deleteMany({
        where: { createdAt: { lt: cutoff } },
      })

      return { deleted: count }
    })

    return result
  },
)
