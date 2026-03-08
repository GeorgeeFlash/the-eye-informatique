import { inngest } from "../client"

// CON-3 — Daily check for overdue installment payments
export const installmentDeadlineCheck = inngest.createFunction(
  { id: "installment-deadline-check" },
  { cron: "0 8 * * *" }, // daily at 08:00
  async ({ step }) => {
    // TODO: find Installments where dueDate < now() and status = PENDING,
    //       mark them OVERDUE, send reminder notifications/emails.
    await step.run("check-deadlines", async () => {
      return { overdue: 0 }
    })
  },
)
