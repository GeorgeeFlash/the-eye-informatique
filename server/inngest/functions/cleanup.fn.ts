import { inngest } from "../client"

// M7.3 — Weekly activity log cleanup (retain last 90 days)
export const activityLogCleanup = inngest.createFunction(
  { id: "activity-log-cleanup" },
  { cron: "0 2 * * 0" }, // every Sunday at 02:00
  async ({ step }) => {
    // TODO: delete ActivityLog rows older than 90 days.
    await step.run("delete-old-logs", async () => {
      return { deleted: 0 }
    })
  },
)
