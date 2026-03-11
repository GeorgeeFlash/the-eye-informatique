import { NextResponse } from "next/server"
import { processPaymentResult } from "@/lib/payment"
import { inngest } from "@/server/inngest/client"
import { db } from "@/server/db"
import { renderToBuffer } from "@react-pdf/renderer"
import { GuaranteeCertificate } from "@/components/pdf/guarantee-certificate"
import { createElement } from "react"
import { logActivity } from "@/lib/activity-log"

/**
 * PayUnit webhook handler.
 * Called by PayUnit after a payment attempt (success or failure).
 */
export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as {
      transaction_id?: string
      status?: string
    }

    const transactionId = payload.transaction_id
    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transaction_id" },
        { status: 400 },
      )
    }

    // Verify the transaction with PayUnit to prevent spoofed webhooks
    const result = await processPaymentResult(transactionId)

    logActivity({
      action: "PAYMENT_COMPLETED",
      entityType: "Order",
      entityId: result.orderId,
      metadata: { transactionId, status: result.status },
    })

    // If payment succeeded, trigger confirmation email via Inngest
    if (result.status === "SUCCESS") {
      const order = await db.order.findUnique({
        where: { id: result.orderId },
        include: {
          user: { select: { email: true, name: true } },
          items: {
            include: {
              variant: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      })

      if (order?.user?.email) {
        // Send confirmation email in background — do not let email failures
        // break the webhook response since payment is already processed.
        try {
          const guaranteeElement = createElement(GuaranteeCertificate, {
            customerName: order.user.name ?? "Customer",
            orderNumber: order.orderNumber,
            purchaseDate: order.createdAt.toISOString(),
            items: order.items.map((i) => ({
              productName: i.variant?.product?.name ?? "Product",
              variant: i.variant?.color ?? undefined,
              quantity: i.quantity,
            })),
            locale: "en",
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pdfBuffer = await renderToBuffer(guaranteeElement as any)

          await inngest.send({
            name: "email/send",
            data: {
              to: order.user.email,
              subject: `Order ${order.orderNumber} — Payment Confirmed`,
              template: "order-confirmation",
              props: {
                customerName: order.user.name ?? "Customer",
                orderId: order.orderNumber,
                items: order.items.map((i) => ({
                  name: i.variant?.product?.name ?? "Product",
                  quantity: i.quantity,
                  price: Number(i.unitPrice),
                })),
                total: Number(order.total),
                deliveryMethod: order.deliveryMethod,
              },
              attachments: [
                {
                  filename: `guarantee-${order.orderNumber}.pdf`,
                  content: Buffer.from(pdfBuffer).toString("base64"),
                },
              ],
            },
          })
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError)
          // Payment is already processed — email can be resent manually
        }
      }
    }

    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    console.error("PayUnit webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    )
  }
}
