// Type augmentations / stubs for @payunit/nodejs-sdk
// Replace with proper types once the package is installed.

export interface PayunitClientOptions {
  apiKey: string
  apiUsername: string
  apiPassword: string
  mode: "test" | "live"
}

export interface PayunitCheckoutItem {
  name: string
  quantity: number
  unit_price: number
}

export interface PayunitCheckoutSessionParams {
  total_amount: number
  currency: string
  items: PayunitCheckoutItem[]
  return_url: string
  notify_url: string
  description?: string
}

export interface PayunitMobileMoneyParams {
  amount: number
  currency: string
  phone_number: string
  gateway: "CM_MTNMOMO" | "CM_ORANGE"
  description?: string
  notify_url: string
}

export interface PayunitInstallmentParams {
  total_amount: number
  currency: string
  installments: Array<{ amount: number; due_date: string }>
  notify_url: string
  description?: string
}

export interface PayunitDisbursementParams {
  amount: number
  currency: string
  phone_number: string
  gateway: "CM_MTNMOMO" | "CM_ORANGE"
  description?: string
}
