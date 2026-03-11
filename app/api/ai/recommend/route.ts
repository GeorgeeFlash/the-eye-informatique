import { generateObject } from "ai"
import { gemini } from "@/server/ai/provider"
import { z } from "zod"
import { aiRateLimit, getIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ip = getIp(req)
  const { success } = await aiRateLimit.limit(ip)
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 })
  }

  const { query, limit = 5 } = await req.json()

  const { object } = await generateObject({
    model: gemini,
    schema: z.object({
      recommendations: z.array(
        z.object({
          productId: z.string(),
          reason: z.string(),
          score: z.number().min(0).max(1),
        })
      ),
    }),
    prompt: `Recommend ${limit} products for a customer with this query: "${query}". 
Return product IDs from the catalog and a reason for each recommendation.`,
  })

  return Response.json(object)
}
