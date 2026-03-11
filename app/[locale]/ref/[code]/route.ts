import { NextResponse } from "next/server"
import { trackAffiliateClick } from "@/actions/affiliate.actions"
import {
  APP_URL,
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_TTL_DAYS,
} from "@/lib/constants"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const result = await trackAffiliateClick(code)

  if (!result) {
    // Invalid or inactive affiliate link → redirect to homepage
    return NextResponse.redirect(new URL("/", APP_URL))
  }

  // Validate the target URL is on the same origin to prevent open redirects
  let redirectUrl: URL
  try {
    redirectUrl = new URL(result.targetUrl, APP_URL)
  } catch {
    return NextResponse.redirect(new URL("/", APP_URL))
  }

  if (redirectUrl.origin !== new URL(APP_URL).origin) {
    // External URL — only allow same-origin redirects for security
    return NextResponse.redirect(new URL("/", APP_URL))
  }

  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set(REFERRAL_COOKIE_NAME, `${result.affiliateId}:${result.linkId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFERRAL_COOKIE_TTL_DAYS * 24 * 60 * 60,
    path: "/",
  })

  return response
}
