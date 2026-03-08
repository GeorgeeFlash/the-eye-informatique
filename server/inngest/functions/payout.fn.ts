import { inngest } from "../client"

// M5.6 — Monthly affiliate commission payouts via PayUnit disbursements
export const monthlyAffiliatePayout = inngest.createFunction(
  { id: "monthly-affiliate-payout" },
  { cron: "0 0 1 * *" }, // 1st of every month at midnight
  async ({ step }) => {
    // TODO: query all APPROVED affiliates with unpaid CONFIRMED referrals,
    //       batch into CommissionPayout records, call PayUnit disbursement API.
    await step.run("process-payouts", async () => {
      return { processed: 0 }
    })
  },
)
