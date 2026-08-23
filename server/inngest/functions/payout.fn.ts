import { inngest } from "../client"
import { db } from "@/server/db"
import { createNotification } from "@/actions/notification.actions"

// M5.6 — Monthly affiliate commission payouts
// Runs on the 1st of every month at midnight
// Only processes affiliates with MONTHLY payout preference
export const monthlyAffiliatePayout = inngest.createFunction(
  { id: "monthly-affiliate-payout", concurrency: { limit: 5 } },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    // 1. Find all approved affiliates with MONTHLY preference and confirmed referrals
    const affiliates = await step.run("find-eligible-affiliates", async () => {
      const results = await db.affiliateProfile.findMany({
        where: {
          status: "APPROVED",
          payoutPreference: "MONTHLY",
          referrals: { some: { status: "CONFIRMED" } },
        },
        include: {
          user: { select: { email: true, name: true } },
          referrals: {
            where: { status: "CONFIRMED" },
            select: { id: true, commission: true },
          },
        },
      })
      return results.map((a) => ({
        id: a.id,
        userId: a.userId,
        userEmail: a.user.email,
        userName: a.user.name,
        payoutMethod: a.payoutMethod,
        payoutPhone: a.payoutPhone,
        total: a.referrals.reduce(
          (sum, r) => sum + r.commission.toNumber(),
          0,
        ),
        referralIds: a.referrals.map((r) => r.id),
      }))
    })

    // 2. Process each affiliate payout in parallel
    const payoutResults = await Promise.all(
      affiliates
        .filter((affiliate) => affiliate.total > 0)
        .map((affiliate) =>
          step.run(`payout-${affiliate.id}`, async () => {
            await db.$transaction(async (tx) => {
              await tx.commissionPayout.create({
                data: {
                  affiliateId: affiliate.id,
                  amount: affiliate.total,
                  currency: "XAF",
                  status: "PENDING",
                },
              })

              await tx.affiliateReferral.updateMany({
                where: { id: { in: affiliate.referralIds } },
                data: { status: "PAID" },
              })

              await tx.affiliateProfile.update({
                where: { id: affiliate.id },
                data: { totalPaid: { increment: affiliate.total } },
              })
            })

            await createNotification({
              userId: affiliate.userId,
              type: "COMMISSION",
              title: "Monthly payout processed",
              body: `Your monthly payout of ${Math.round(affiliate.total)} FCFA has been initiated.`,
              link: "/dashboard/affiliate/payouts",
            })

            if (affiliate.userEmail) {
              await inngest.send({
                id: `monthly-payout-email-${affiliate.id}`,
                name: "email/send",
                data: {
                  to: affiliate.userEmail,
                  subject: "Monthly Commission Payout",
                  template: "payout-notification" as const,
                  messageId: `monthly-payout-${affiliate.id}`,
                  props: {
                    affiliateName: affiliate.userName ?? "Affiliate",
                    amount: Math.round(affiliate.total),
                    currency: "XAF",
                    payoutMethod: affiliate.payoutMethod,
                  },
                },
              })
            }

            return { id: affiliate.id, success: true }
          }),
        ),
    )

    const processed = payoutResults.filter((r) => r?.success).length
    return { processed, total: affiliates.length }
  },
)
