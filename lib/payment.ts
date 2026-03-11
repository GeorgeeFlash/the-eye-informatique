import { db } from "@/server/db"
import { initiatePayment, verifyTransaction } from "@/server/payunit"
import { APP_URL } from "@/lib/constants"

/**
 * Create a PayUnit checkout session for an order or installment.
 */
export async function createCheckoutSession(params: {
  orderId: string
  amount: number
  gateway: string
  customerName?: string
  customerEmail?: string
  installmentId?: string
}) {
  const returnPath = params.installmentId
    ? `/dashboard/orders/${params.orderId}?installment=paid`
    : `/dashboard/orders/${params.orderId}?payment=complete`

  const isDevelopment = process.env.NODE_ENV === "development"
  const notifyUrlOnDevelopment = `https://drake-whole-poorly.ngrok-free.app/api/webhooks/payunit`

  const result = await initiatePayment({
    totalAmount: params.amount,
    orderId: params.installmentId ?? params.orderId,
    gateway: params.gateway,
    returnUrl: `${APP_URL}${returnPath}`,
    notifyUrl: isDevelopment ? notifyUrlOnDevelopment : `${APP_URL}/api/webhooks/payunit`,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    description: params.installmentId
      ? `Installment for order ${params.orderId}`
      : `Payment for order ${params.orderId}`,
  })

  // Store the PayUnit transaction ID on the payment/installment record
  if (params.installmentId) {
    await db.installment.update({
      where: { id: params.installmentId },
      data: { payunitInvoiceId: result.transactionId },
    })
  } else {
    await db.payment.update({
      where: { orderId: params.orderId },
      data: { payunitTransactionId: result.transactionId },
    })
  }

  return result
}

/**
 * Verify and process a PayUnit transaction.
 * Updates payment/installment status in the database.
 */
export async function processPaymentResult(transactionId: string) {
  const result = await verifyTransaction(transactionId)

  // Check if this is an installment payment
  const installment = await db.installment.findFirst({
    where: { payunitInvoiceId: transactionId },
    include: { order: true },
  })

  if (installment) {
    return processInstallmentPayment(installment, result)
  }

  // Otherwise it's a full order payment
  const payment = await db.payment.findFirst({
    where: { payunitTransactionId: transactionId },
    include: { order: true },
  })

  if (!payment) {
    throw new Error(`No payment found for transaction ${transactionId}`)
  }

  if (result.status === "SUCCESS") {
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
        },
      }),
      db.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: "CONFIRMED",
          note: "Payment confirmed via PayUnit",
        },
      }),
    ])
    return { status: "SUCCESS" as const, orderId: payment.orderId }
  }

  if (result.status === "FAILED") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    })
    return { status: "FAILED" as const, orderId: payment.orderId }
  }

  return { status: "PENDING" as const, orderId: payment.orderId }
}

async function processInstallmentPayment(
  installment: { id: string; orderId: string; order: { id: string } },
  result: { status: "SUCCESS" | "FAILED" | "PENDING" },
) {
  if (result.status === "SUCCESS") {
    await db.installment.update({
      where: { id: installment.id },
      data: { status: "PAID", paidAt: new Date() },
    })

    // Check if all installments are now paid
    const remaining = await db.installment.count({
      where: {
        orderId: installment.orderId,
        status: { not: "PAID" },
      },
    })

    if (remaining === 0) {
      await db.$transaction([
        db.payment.update({
          where: { orderId: installment.orderId },
          data: {
            status: "SUCCESS",
            paidAt: new Date(),
            receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
          },
        }),
        db.order.update({
          where: { id: installment.orderId },
          data: { status: "CONFIRMED" },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: installment.orderId,
            status: "CONFIRMED",
            note: "All installments paid — order fully confirmed",
          },
        }),
      ])
    }

    return { status: "SUCCESS" as const, orderId: installment.orderId }
  }

  return { status: result.status, orderId: installment.orderId }
}
