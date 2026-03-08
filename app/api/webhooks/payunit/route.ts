// TODO: Implement PayUnit webhook handler once @payunit/nodejs-sdk is installed
// and webhook signature verification method is confirmed from SDK docs.
// Expected events: payment.success, payment.failed, payment.pending

export async function POST(req: Request) {
  const payload = await req.json()

  // TODO: Verify webhook signature
  // TODO: Handle payment.success → update Order.paymentStatus, trigger email
  // TODO: Handle payment.failed → update Order.paymentStatus
  // TODO: Handle installment payment events

  console.log("PayUnit webhook received:", payload)

  return new Response("OK", { status: 200 })
}
