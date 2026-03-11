import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { globalRateLimit, authRateLimit, getIp } from "@/lib/rate-limit"

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
  const ip = getIp(req)

  // 1a. Stricter rate limits on auth endpoints
  if (isAuthRoute(req)) {
    const { success } = await authRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before retrying." },
        { status: 429 },
      )
    }
  }

  // 1b. Global rate limiting (skip webhook endpoints)
  if (!req.nextUrl.pathname.startsWith("/api/webhooks")) {
    const { success } = await globalRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429 },
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
