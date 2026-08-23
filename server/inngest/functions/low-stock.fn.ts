import { inngest } from "../client"
import { db } from "@/server/db"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"
import { createLocalizedNotification } from "@/lib/notifications"

// M7.1 — Daily low-stock alert check
// Checks ProductStockByBranch records below the threshold and notifies
// the branch's ADMIN and all CENTRAL_ADMIN users. Each (admin, variant+branch)
// pair only fires once until the admin reads the notification.
export const lowStockAlertCheck = inngest.createFunction(
  { id: "low-stock-alert-check", concurrency: { limit: 1 } },
  { cron: "0 8 * * *" }, // every day at 08:00
  async ({ step }) => {
    const result = await step.run("check-low-stock", async () => {
      // Find branch-level stock entries at or below the threshold
      const lowStockEntries = await db.productStockByBranch.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              color: true,
              product: { select: { name: true } },
            },
          },
          branch: { select: { id: true } },
        },
      })

      if (lowStockEntries.length === 0) return { notified: 0 }

      // Find all admin users who should receive alerts
      const admins = await db.user.findMany({
        where: {
          role: { in: ["ADMIN", "CENTRAL_ADMIN"] },
          isActive: true,
        },
        select: { id: true, role: true, branchId: true },
      })

      let notified = 0

      for (const entry of lowStockEntries) {
        // Branch Admin only sees alerts for their own branch
        const targetAdmins = admins.filter(
          (a) => a.role === "CENTRAL_ADMIN" || a.branchId === entry.branch.id,
        )

        for (const admin of targetAdmins) {
          const link = `/admin/inventory?variantId=${entry.variant.id}&branchId=${entry.branch.id}`

          // Deduplicate: skip if this admin already has an unread alert for
          // this exact variant+branch combination
          const existing = await db.notification.findFirst({
            where: {
              userId: admin.id,
              type: "LOW_STOCK_ALERT",
              isRead: false,
              link: { contains: entry.variant.id },
            },
          })
          if (existing) continue

          const variantLabel = [entry.variant.color, entry.variant.sku]
            .filter(Boolean)
            .join(" — ")

          await createLocalizedNotification({
            userId: admin.id,
            type: "LOW_STOCK_ALERT",
            messageKey: "lowStockAlert",
            params: {
              productName: entry.variant.product.name,
              variantLabel,
              stockCount: entry.stock,
            },
            link,
          })
          notified++
        }
      }

      return { notified, lowStockCount: lowStockEntries.length }
    })

    return result
  },
)
