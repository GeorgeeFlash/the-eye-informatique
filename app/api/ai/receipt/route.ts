import { generateObject } from "ai"
import { gemini } from "@/server/ai/provider"
import { z } from "zod"

export async function POST(req: Request) {
  const formData = await req.formData()
  const image = formData.get("image") as File | null

  if (!image) {
    return Response.json({ error: "No image provided" }, { status: 400 })
  }

  const imageBytes = await image.arrayBuffer()
  const base64 = Buffer.from(imageBytes).toString("base64")

  const { object } = await generateObject({
    model: gemini,
    schema: z.object({
      productName: z.string(),
      brand: z.string().optional(),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().optional(),
      price: z.number().optional(),
      storeName: z.string().optional(),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: base64,
            mediaType: image.type as "image/jpeg" | "image/png" | "image/webp",
          },
          {
            type: "text",
            text: "Extract the product information from this receipt or warranty card.",
          },
        ],
      },
    ],
  })

  return Response.json(object)
}
