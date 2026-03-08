import { generateText } from "ai"
import { gemini } from "@/server/ai/provider"

export async function POST(req: Request) {
  const { productName, brand, specs, locale = "fr" } = await req.json()

  const language = locale === "fr" ? "French" : "English"

  const { text } = await generateText({
    model: gemini,
    prompt: `Write a compelling product description in ${language} for a tech store in Cameroon.
Product: ${productName}
Brand: ${brand ?? "Unknown"}
Specifications: ${JSON.stringify(specs ?? {})}

The description should be 2-3 paragraphs, highlight key features, and appeal to Cameroonian customers.`,
  })

  return Response.json({ description: text })
}
