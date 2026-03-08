import { createElement } from "react"
import { inngest } from "../client"
import { resend, FROM_EMAIL } from "@/server/resend"
import { OrderConfirmationEmail } from "@/components/email/order-confirmation"
import { RepairStatusEmail } from "@/components/email/repair-status"
import { AffiliateWelcomeEmail } from "@/components/email/affiliate-welcome"
import { InstallmentReminderEmail } from "@/components/email/installment-reminder"
import { PayoutNotificationEmail } from "@/components/email/payout-notification"

// Registry of all serializable email templates.
// Add new templates here as they are created.
const EMAIL_TEMPLATES = {
  "order-confirmation": OrderConfirmationEmail,
  "repair-status": RepairStatusEmail,
  "affiliate-welcome": AffiliateWelcomeEmail,
  "installment-reminder": InstallmentReminderEmail,
  "payout-notification": PayoutNotificationEmail,
} as const

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES

// Event data shape — fully JSON-serializable (no React elements).
export type SendEmailEventData = {
  to: string
  subject: string
  template: EmailTemplateName
  // Props are passed as a plain object and cast to the component's prop type
  // inside the step, keeping the event payload JSON-safe.
  props: Record<string, unknown>
}

// M7.1 — Async email dispatch triggered by "email/send" events
export const sendEmail = inngest.createFunction(
  { id: "send-email" },
  { event: "email/send" },
  async ({ event, step }) => {
    const { to, subject, template, props } = event.data as SendEmailEventData

    await step.run("send-via-resend", async () => {
      const Component = EMAIL_TEMPLATES[template]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const react = createElement(Component, props as any)
      return resend.emails.send({ from: FROM_EMAIL, to, subject, react })
    })
  },
)
