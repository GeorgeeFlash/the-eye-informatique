import arcjet, { shield, detectBot, slidingWindow, fixedWindow } from "@arcjet/next"
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
      // Allow search engines AND verified webhook senders (e.g. Svix / Clerk)
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR"],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "60s",
      max: 120,
    }),
  ],
})

// ---------------------------------------------------------------------------
// Arcjet — stricter limits for auth & checkout endpoints
// ---------------------------------------------------------------------------
const ajAuth = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    fixedWindow({
      mode: "LIVE",
      window: "60s",
      max: 10,
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

const isAuthRoute = createRouteMatcher([
  "/(en|fr)/sign-in(.*)",
  "/(en|fr)/sign-up(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

// API routes that must never be touched by the intl middleware
const isApiRoute = createRouteMatcher(["/api/(.*)", "/trpc/(.*)"])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1a. Arcjet — stricter rate limits on auth endpoints
  if (isAuthRoute(req)) {
    const authDecision = await ajAuth.protect(req)
    if (authDecision.isDenied()) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before retrying." },
        { status: 429 },
      )
    }
  }

  // 1b. Arcjet — global shield, bot detection, rate limiting
  // Skip bot detection for webhook endpoints (Svix / third-party senders)
  if (!req.nextUrl.pathname.startsWith("/api/webhooks")) {
    const decision = await aj.protect(req)
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: decision.reason.isRateLimit() ? "Too Many Requests" : "Forbidden" },
        { status: decision.reason.isRateLimit() ? 429 : 403 },
      )
    }
  }

  // 2. Clerk — enforce auth on private (dashboard) routes
  if (isPrivateRoute(req)) {
    await auth.protect()
  }

  // 3. next-intl — locale detection & routing
  // API / tRPC routes must NOT be processed by the intl middleware because
  // next-intl would redirect them to /<locale>/api/… which has no handler → 404
  if (isApiRoute(req)) {
    return NextResponse.next()
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
