import { inngest } from "../client"
import { db } from "@/server/db"
import { resend, FROM_EMAIL } from "@/server/resend"
import { InstallmentReminderEmail } from "@/components/email/installment-reminder"

// CON-3 — Daily check for overdue installment payments
export const installmentDeadlineCheck = inngest.createFunction(
  { id: "installment-deadline-check" },
  { cron: "0 8 * * *" }, // daily at 08:00
  async ({ step }) => {
    const overdue = await step.run("mark-overdue", async () => {
      const now = new Date()

      // Find pending installments past due date
      const overdueInstallments = await db.installment.findMany({
        where: {
          status: "PENDING",
          dueDate: { lt: now },
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              _count: { select: { installments: true } },
            },
          },
        },
      })

      // Mark them OVERDUE
      if (overdueInstallments.length > 0) {
        await db.installment.updateMany({
          where: {
            id: { in: overdueInstallments.map((i) => i.id) },
          },
          data: { status: "OVERDUE" },
        })
      }

      return overdueInstallments
    })

    // Send reminder emails for each overdue installment
    await step.run("send-reminders", async () => {
      for (const installment of overdue) {
        const { order } = installment
        if (!order.user?.email) continue

        await resend.emails.send({
          from: FROM_EMAIL,
          to: order.user.email,
          subject: `Installment overdue — Order ${order.orderNumber}`,
          react: InstallmentReminderEmail({
            customerName: order.user.name ?? "Customer",
            orderId: order.orderNumber,
            dueDate: new Date(installment.dueDate),
            amount: Number(installment.amount),
            installmentNumber: installment.sequenceNumber,
            totalInstallments: order._count.installments,
          }),
        })
      }

      return { sent: overdue.length }
    })

    return { overdue: overdue.length }
  },
)
