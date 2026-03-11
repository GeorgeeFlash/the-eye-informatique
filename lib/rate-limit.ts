import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/server/redis"
import { headers } from "next/headers"

// ---------------------------------------------------------------------------
// Rate limiter instances
// ---------------------------------------------------------------------------

/** Global rate limit — 120 requests per 60s per IP (sliding window) */
export const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "60s"),
  prefix: "rl:global",
})

/** Auth endpoints — 10 requests per 60s per IP (fixed window) */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, "60s"),
  prefix: "rl:auth",
})

/** Contact form — 3 submissions per hour per IP */
export const contactFormRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1h"),
  prefix: "rl:contact",
})

/** AI API routes — 10 requests per 60s per IP */
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60s"),
  prefix: "rl:ai",
})

// ---------------------------------------------------------------------------
// IP extraction helpers
// ---------------------------------------------------------------------------

/** Extract client IP from a Request object (middleware context) */
export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "127.0.0.1"
}

/** Extract client IP from Next.js headers() (server action / route handler context) */
export async function getIpFromHeaders(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip") ?? "127.0.0.1"
}
