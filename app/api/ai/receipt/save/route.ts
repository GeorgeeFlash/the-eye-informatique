import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"

export async function POST(req: Request) {
  await requireRole(["ADMIN", "BRANCH_ADMIN", "STAFF"])

  const data = await req.json()

  await db.inStorePurchase.create({
    data: {
      totalAmount: data.price ?? 0,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      items: [
        {
          name: data.productName,
          qty: 1,
          unitPrice: data.price ?? 0,
        },
      ],
    },
  })

  return Response.json({ success: true })
}
