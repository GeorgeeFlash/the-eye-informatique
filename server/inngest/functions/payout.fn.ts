import { inngest } from "../client"
import { db } from "@/server/db"
import { createNotification } from "@/actions/notification.actions"

// M5.6 — Monthly affiliate commission payouts
// Runs on the 1st of every month at midnight
export const monthlyAffiliatePayout = inngest.createFunction(
  { id: "monthly-affiliate-payout" },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    // 1. Find all approved affiliates with confirmed (unpaid) referrals
    const affiliates = await step.run("find-eligible-affiliates", async () => {
      const results = await db.affiliateProfile.findMany({
        where: {
          status: "APPROVED",
          referrals: { some: { status: "CONFIRMED" } },
        },
        include: {
          referrals: {
            where: { status: "CONFIRMED" },
            select: { id: true, commission: true },
          },
        },
      })
      return results.map((a) => ({
        id: a.id,
        userId: a.userId,
        payoutMethod: a.payoutMethod,
        payoutPhone: a.payoutPhone,
        total: a.referrals.reduce(
          (sum, r) => sum + r.commission.toNumber(),
          0,
        ),
        referralIds: a.referrals.map((r) => r.id),
      }))
    })

    // 2. Process each affiliate payout
    let processed = 0
    for (const affiliate of affiliates) {
      if (affiliate.total <= 0) continue

      await step.run(`payout-${affiliate.id}`, async () => {
        await db.$transaction(async (tx) => {
          // Create payout record
          await tx.commissionPayout.create({
            data: {
              affiliateId: affiliate.id,
              amount: affiliate.total,
              currency: "XAF",
              status: "PENDING",
            },
          })

          // Mark referrals as paid
          await tx.affiliateReferral.updateMany({
            where: { id: { in: affiliate.referralIds } },
            data: { status: "PAID" },
          })

          // Update profile totals
          await tx.affiliateProfile.update({
            where: { id: affiliate.id },
            data: { totalPaid: { increment: affiliate.total } },
          })
        })

        // Notify affiliate
        await createNotification({
          userId: affiliate.userId,
          type: "COMMISSION",
          title: "Monthly payout processed",
          body: `Your monthly payout of ${Math.round(affiliate.total)} XAF has been initiated.`,
          link: "/dashboard/affiliate/payouts",
        })
      })

      processed++
    }

    return { processed, total: affiliates.length }
  },
)
