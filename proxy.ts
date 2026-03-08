import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/next"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ---------------------------------------------------------------------------
// Arcjet — global rules applied to every request
// ---------------------------------------------------------------------------
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "60s",
      max: 120,
    }),
  ],
})

// ---------------------------------------------------------------------------
// next-intl — locale resolution middleware
// ---------------------------------------------------------------------------
const intlMiddleware = createIntlMiddleware(routing)

// ---------------------------------------------------------------------------
// Clerk — only dashboard routes require authentication
// ---------------------------------------------------------------------------
const isPrivateRoute = createRouteMatcher([
  "/(en|fr)/(dashboard)(.*)",
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Arcjet — shield, bot detection, rate limiting
  const decision = await aj.protect(req)
  if (decision.isDenied()) {
    return NextResponse.json(
      { error: decision.reason.isRateLimit() ? "Too Many Requests" : "Forbidden" },
      { status: decision.reason.isRateLimit() ? 429 : 403 },
    )
  }

  // 2. Clerk — enforce auth on private (dashboard) routes
  if (isPrivateRoute(req)) {
    await auth.protect()
  }

  // 3. next-intl — locale detection & routing
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
