// Shared TypeScript types for Tei Store

// ---------------------------------------------------------------------------
// Roles & Auth
// ---------------------------------------------------------------------------

export type Role = "CUSTOMER" | "AFFILIATE" | "STAFF" | "ADMIN" | "CENTRAL_ADMIN"

// ---------------------------------------------------------------------------
// Platform types
// ---------------------------------------------------------------------------

export type Locale = "en" | "fr"

export type Currency = "XAF"

// ---------------------------------------------------------------------------
// Order & Payment
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"

export type PaymentGateway = "CM_MTNMOMO" | "CM_ORANGE"

export type DeliveryMethod = "PICKUP" | "DELIVERY"

export type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE"

// ---------------------------------------------------------------------------
// Affiliate
// ---------------------------------------------------------------------------

export type AffiliateStatus = "PENDING" | "APPROVED" | "SUSPENDED"

export type ReferralStatus = "PENDING" | "CONFIRMED" | "PAID"

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

// ---------------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------------

export type RepairStatus =
  | "SUBMITTED"
  | "DIAGNOSED"
  | "IN_REPAIR"
  | "READY"
  | "RETURNED"
  | "CLOSED"

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export type NotificationType =
  | "ORDER_UPDATE"
  | "REPAIR_UPDATE"
  | "COMMISSION"
  | "SYSTEM"
  | "PROMOTION"

// ---------------------------------------------------------------------------
// Cart (client-side Zustand)
// ---------------------------------------------------------------------------

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string // e.g. "Black / New"
  sku: string
  price: number
  quantity: number
  // Snapshot of known stock for this variant when item is added/updated.
  stockAvailable?: number
  imageUrl?: string
  /** Branch that fulfils this item (from stockByBranch). */
  branchId?: string
  branchCity?: string
}

// ---------------------------------------------------------------------------
// Inngest event catalog
// ---------------------------------------------------------------------------

export interface EmailSendEvent {
  name: "email/send"
  data: {
    to: string
    subject: string
    templateId: string
    payload: Record<string, unknown>
  }
}

export interface OrderPaymentConfirmedEvent {
  name: "order/payment.confirmed"
  data: { orderId: string }
}

export type TeiEvents = EmailSendEvent | OrderPaymentConfirmedEvent
