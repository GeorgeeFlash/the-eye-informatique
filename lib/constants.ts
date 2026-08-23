// App-wide constants for Tei Store

import { clientEnv } from "@/lib/env-client"

export const APP_NAME = "The Eye Informatique"
export const APP_URL = clientEnv.NEXT_PUBLIC_APP_URL

// Localisation
export const LOCALES = ["en", "fr"] as const
export const DEFAULT_LOCALE = "en" as const
export type Locale = (typeof LOCALES)[number]

// Currency (CON-1)
export const CURRENCY = "XAF"

// Pagination
export const DEFAULT_PAGE_SIZE = 20

// Roles
export const ROLES = ["CUSTOMER", "AFFILIATE", "STAFF", "ADMIN", "CENTRAL_ADMIN"] as const

// Affiliate
export const DEFAULT_COMMISSION_RATE = 0.05 // 5%
export const REFERRAL_COOKIE_NAME = "tei_ref"
export const REFERRAL_COOKIE_TTL_DAYS = 30

// Activity log retention (days)
export const ACTIVITY_LOG_RETENTION_DAYS = 90

// Low stock alert threshold
export const LOW_STOCK_THRESHOLD = 5

// PayUnit (CON-1)
export const PAYUNIT_GATEWAYS = {
  MTN: "CM_MTNMOMO",
  ORANGE: "CM_ORANGE",
} as const

// Routes (used in Notification.link and internal redirects)
export const ROUTES = {
  home: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
  affiliate: "/affiliate",
  signIn: "/sign-in",
  signUp: "/sign-up",
  dashboard: {
    admin: "/dashboard",
    centralAdmin: "/central-admin",
    affiliate: "/affiliate",
    customer: "/customer",
  },
} as const

// Social links
export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/theeyeinformatique",
  instagram: "https://instagram.com/theeyeinformatique",
  twitter: "https://x.com/theeyeinfo",
  // TODO: Replace with the actual business WhatsApp number before deployment
  whatsapp: "https://wa.me/237000000000",
  tiktok: "https://tiktok.com/@theeyeinformatique",
} as const
