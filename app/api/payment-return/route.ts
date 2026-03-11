import { NextResponse } from "next/server"
import { APP_URL } from "@/lib/constants"

/**
 * Public redirect endpoint used as the PayUnit `return_url` in development.
 *
 * In development, PayUnit requires an HTTPS URL (ngrok), but the user's Clerk
 * session cookie is scoped to localhost. Redirecting through this public route
 * lets ngrok forward the request here, after which we send the browser back to
 * the real local app URL where the user is already authenticated.
 *
 * In production APP_URL is the real domain, so this route is still valid but
 * just performs a same-domain redirect to the order page.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")
  const installmentId = searchParams.get("installmentId")

  const path = installmentId
    ? `/dashboard/orders/${orderId}?installment=paid`
    : `/dashboard/orders/${orderId}?payment=complete`

  // Always redirect to APP_URL (localhost:3000 in dev, real domain in prod)
  return NextResponse.redirect(`${APP_URL}${path}`)
}
