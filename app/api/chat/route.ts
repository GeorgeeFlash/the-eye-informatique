import { streamText } from "ai"
import { gemini } from "@/server/ai/provider"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: gemini,
    system:
      "You are a helpful assistant for The Eye Informatique, a tech store in Cameroon. " +
      "Help customers find products, answer questions about electronics, repairs, and services. " +
      "Respond in the same language the customer uses (French or English).",
    messages,
  })

  return result.toTextStreamResponse()
}
