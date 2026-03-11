import { serve } from "inngest/next"
import { inngest } from "@/server/inngest/client"
import { monthlyAffiliatePayout } from "@/server/inngest/functions/payout.fn"
import { immediateAffiliatePayout } from "@/server/inngest/functions/immediate-payout.fn"
import { installmentDeadlineCheck } from "@/server/inngest/functions/installment.fn"
import { activityLogCleanup, productPageViewCleanup } from "@/server/inngest/functions/cleanup.fn"
import { sendEmail } from "@/server/inngest/functions/email.fn"
import { lowStockAlertCheck } from "@/server/inngest/functions/low-stock.fn"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    monthlyAffiliatePayout,
    immediateAffiliatePayout,
    installmentDeadlineCheck,
    activityLogCleanup,
    productPageViewCleanup,
    sendEmail,
    lowStockAlertCheck,
  ],
})
