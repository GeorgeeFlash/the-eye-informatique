import { inngest } from "../client"
import { resend, FROM_EMAIL } from "@/server/resend"

// M7.1 — Async email dispatch triggered by "email/send" events
export const sendEmail = inngest.createFunction(
  { id: "send-email" },
  { event: "email/send" },
  async ({ event, step }) => {
    const { to, subject, react } = event.data as {
      to: string
      subject: string
      react: React.ReactElement
    }

    await step.run("send-via-resend", async () => {
      return resend.emails.send({ from: FROM_EMAIL, to, subject, react })
    })
  },
)
