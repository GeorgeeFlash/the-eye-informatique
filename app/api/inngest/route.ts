import { serve } from "inngest/next"
import { inngest } from "@/server/inngest/client"
import { monthlyAffiliatePayout } from "@/server/inngest/functions/payout.fn"
import { installmentDeadlineCheck } from "@/server/inngest/functions/installment.fn"
import { activityLogCleanup } from "@/server/inngest/functions/cleanup.fn"
import { sendEmail } from "@/server/inngest/functions/email.fn"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    monthlyAffiliatePayout,
    installmentDeadlineCheck,
    activityLogCleanup,
    sendEmail,
  ],
})
