// PayUnit SDK client singleton
// Docs: https://developer.payunit.net/sdk-and-plugins/nodejs

import { PayunitClient } from "@payunit/nodejs-sdk"
import type {
  TransactionPaymentStatusResponse,
  CheckoutInitializeRequest,
  CheckoutInitializeResponse,
  DisbursementInitResponse,
  DisbursementConfirmResponse,
} from "@payunit/nodejs-sdk"

// ---------------------------------------------------------------------------
// Singleton client — reused across all server calls
// ---------------------------------------------------------------------------

let _client: PayunitClient | null = null

function getClient(): PayunitClient {
  if (!_client) {
    _client = new PayunitClient({
      apiKey: process.env.PAYUNIT_API_KEY!,
      apiUsername: process.env.PAYUNIT_API_USERNAME!,
      apiPassword: process.env.PAYUNIT_API_PASSWORD!,
      mode: (process.env.PAYUNIT_MODE as "test" | "live") ?? "test",
    })
  }
  return _client
}

export { getClient as getPayUnitClient }

// ---------------------------------------------------------------------------
// Collections — initiate payment & verify
// ---------------------------------------------------------------------------

/**
 * Initiate a payment transaction with PayUnit (Collections service).
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
  const client = getClient()

  const response = await client.collections.initiatePayment({
    total_amount: params.totalAmount,
    currency: "XAF",
    transaction_id: params.orderId,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    pay_with: params.gateway,
    payment_country: "CM",
    redirect_on_failed: "yes",
    custom_fields: {
      order_id: params.orderId,
      customer_name: params.customerName ?? "",
      customer_email: params.customerEmail ?? "",
      description: params.description ?? `Order ${params.orderId}`,
    },
  })

  return {
    transactionId: response.transaction_id ?? response.t_id,
    redirectUrl: response.transaction_url ?? response.t_url,
  }
}

/**
 * Verify a PayUnit transaction status (Collections service).
 */
export async function verifyTransaction(transactionId: string): Promise<{
  status: "SUCCESS" | "FAILED" | "PENDING"
  amount?: number
  gateway?: string
  transactionRef?: string
}> {
  const client = getClient()

  const data: TransactionPaymentStatusResponse =
    await client.collections.getTransactionStatus(transactionId)

  const statusMap: Record<string, "SUCCESS" | "FAILED" | "PENDING"> = {
    SUCCESS: "SUCCESS",
    SUCCESSFUL: "SUCCESS",
    COMPLETED: "SUCCESS",
    FAILED: "FAILED",
    CANCELLED: "FAILED",
    PENDING: "PENDING",
  }

  return {
    status: statusMap[data.transaction_status?.toUpperCase()] ?? "PENDING",
    amount: data.transaction_amount,
    gateway: data.transaction_gateway,
    transactionRef: data.transaction_id,
  }
}

// ---------------------------------------------------------------------------
// Checkout — full checkout session (items, customer, success/cancel URLs)
// ---------------------------------------------------------------------------

/**
 * Initialize a PayUnit Checkout session with line-item details.
 */
export async function initializeCheckout(
  params: CheckoutInitializeRequest,
): Promise<CheckoutInitializeResponse> {
  const client = getClient()
  return client.checkout.initialize(params)
}

/**
 * Retrieve the status of a checkout session.
 */
export async function getCheckoutStatus(checkoutId: string) {
  const client = getClient()
  return client.checkout.getStatus(checkoutId)
}

// ---------------------------------------------------------------------------
// Disbursements — affiliate / payout
// ---------------------------------------------------------------------------

/**
 * Create a disbursement to send money via mobile money.
 */
export async function createDisbursement(params: {
  amount: number
  accountNumber: string
  beneficiaryName: string
  gateway: string
  transactionId: string
}): Promise<DisbursementInitResponse> {
  const client = getClient()

  return client.disbursement.createDisbursement({
    destination_currency: "XAF",
    debit_currency: "XAF",
    account_number: Number(params.accountNumber),
    amount: params.amount,
    beneficiary_name: params.beneficiaryName,
    deposit_type: "MOBILE_MONEY",
    transaction_id: params.transactionId,
    country: "CM",
    account_bank: params.gateway,
  })
}

/**
 * Confirm a previously created disbursement.
 */
export async function confirmDisbursement(params: {
  payToken: string
  message: string
  notifyUrl: string
}): Promise<DisbursementConfirmResponse> {
  const client = getClient()

  return client.disbursement.confirmDisbursement({
    pay_token: params.payToken,
    deposit_message: params.message,
    deposit_note: params.message,
    notify_url: params.notifyUrl,
  })
}

/**
 * Get the status of a disbursement.
 */
export async function getDisbursementStatus(payToken: string) {
  const client = getClient()
  return client.disbursement.getDisbursementStatus(payToken)
}
