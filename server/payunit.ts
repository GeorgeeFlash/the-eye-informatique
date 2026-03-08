// PayUnit SDK client singleton
// Docs: https://doc.payunit.net/
//
// PayUnit uses a REST API with API key authentication.
// We implement a lightweight client rather than depending on a third-party SDK package.

const PAYUNIT_API_URL =
  process.env.PAYUNIT_MODE === "live"
    ? "https://gateway.payunit.net/api"
    : "https://gateway.payunit.net/api"

const payunitHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": process.env.PAYUNIT_API_KEY ?? "",
  Authorization: `Bearer ${Buffer.from(
    `${process.env.PAYUNIT_API_USERNAME ?? ""}:${process.env.PAYUNIT_API_PASSWORD ?? ""}`,
  ).toString("base64")}`,
})

export interface PayUnitTransaction {
  t_id: string
  t_url: string
  transaction_id: string
  status: string
}

/**
 * Initiate a payment transaction with PayUnit.
 * Returns a redirect URL for the customer to complete payment.
 */
export async function initiatePayment(params: {
  totalAmount: number
  orderId: string
  gateway: string
  returnUrl: string
  notifyUrl: string
  customerName?: string
  customerEmail?: string
  description?: string
}): Promise<{ transactionId: string; redirectUrl: string }> {
  const body = {
    total_amount: params.totalAmount,
    currency: "XAF",
    transaction_id: params.orderId,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    purchaseRef: params.orderId,
    gateway: params.gateway,
    description: params.description ?? `Order ${params.orderId}`,
    name: params.customerName ?? "",
    email: params.customerEmail ?? "",
  }

  const response = await fetch(`${PAYUNIT_API_URL}/gateway/initialize`, {
    method: "POST",
    headers: payunitHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PayUnit initiate payment failed: ${response.status} — ${text}`)
  }

  const data = (await response.json()) as PayUnitTransaction

  return {
    transactionId: data.transaction_id ?? data.t_id,
    redirectUrl: data.t_url,
  }
}

/**
 * Verify a PayUnit transaction status.
 */
export async function verifyTransaction(transactionId: string): Promise<{
  status: "SUCCESS" | "FAILED" | "PENDING"
  amount?: number
  gateway?: string
  transactionRef?: string
}> {
  const response = await fetch(
    `${PAYUNIT_API_URL}/gateway/verify/${transactionId}`,
    {
      method: "GET",
      headers: payunitHeaders(),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PayUnit verify failed: ${response.status} — ${text}`)
  }

  const data = (await response.json()) as {
    status: string
    transaction_amount?: number
    gateway?: string
    transaction_id?: string
  }

  const statusMap: Record<string, "SUCCESS" | "FAILED" | "PENDING"> = {
    SUCCESS: "SUCCESS",
    SUCCESSFUL: "SUCCESS",
    COMPLETED: "SUCCESS",
    FAILED: "FAILED",
    CANCELLED: "FAILED",
    PENDING: "PENDING",
  }

  return {
    status: statusMap[data.status?.toUpperCase()] ?? "PENDING",
    amount: data.transaction_amount,
    gateway: data.gateway,
    transactionRef: data.transaction_id,
  }
}
