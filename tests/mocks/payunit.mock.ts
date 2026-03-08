export const payunitMock = {
  createCheckoutSession: jest.fn().mockResolvedValue({
    sessionId: "test-session-id",
    checkoutUrl: "https://pay.payunit.cm/test",
    status: "pending",
  }),
  verifyPayment: jest.fn().mockResolvedValue({
    transactionId: "test-txn-id",
    status: "success",
    amount: 0,
    currency: "XAF",
  }),
  createDisbursement: jest.fn().mockResolvedValue({
    disbursementId: "test-disbursement-id",
    status: "pending",
  }),
}

jest.mock("@/server/payunit", () => ({
  payunit: payunitMock,
}))
