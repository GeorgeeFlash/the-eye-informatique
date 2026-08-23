import { inngest } from "../client"
import { db } from "@/server/db"

// CON-3 — Daily check for overdue installment payments
export const installmentDeadlineCheck = inngest.createFunction(
  { id: "installment-deadline-check", concurrency: { limit: 1 } },
  { cron: "0 8 * * *" }, // daily at 08:00
  async ({ step }) => {
    const { overdueInstallments } = await step.run("mark-overdue", async () => {
      const now = new Date()

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

      if (overdueInstallments.length > 0) {
        await db.installment.updateMany({
          where: {
            id: { in: overdueInstallments.map((i) => i.id) },
          },
          data: { status: "OVERDUE" },
        })
      }

      return { overdueInstallments }
    })

    const events = overdueInstallments
      .filter((i) => i.order.user?.email)
      .map((installment) => {
        const { order } = installment
        return {
          id: `installment-reminder-${installment.id}`,
          name: "email/send",
          data: {
            to: order.user!.email!,
            subject: `Installment overdue — Order ${order.orderNumber}`,
            template: "installment-reminder",
            messageId: `installment-reminder-${installment.id}`,
            props: {
              customerName: order.user.name ?? "Customer",
              orderId: order.orderNumber,
              dueDate: new Date(installment.dueDate).toISOString(),
              amount: Number(installment.amount),
              installmentNumber: installment.sequenceNumber,
              totalInstallments: order._count.installments,
            },
          },
        }
      })

    const skipped = overdueInstallments.length - events.length

    const CHUNK_SIZE = 20
    let sent = 0
    await step.run("send-reminders", async () => {
      for (let i = 0; i < events.length; i += CHUNK_SIZE) {
        const chunk = events.slice(i, i + CHUNK_SIZE)
        await inngest.send(chunk)
        sent += chunk.length
      }
      return { sent, skipped }
    })

    return { overdue: overdueInstallments.length, sent, skipped }
  },
)
