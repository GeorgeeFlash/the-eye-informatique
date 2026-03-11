import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/server/db"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  GuaranteeCertificate,
  type GuaranteeCertificateProps,
} from "@/components/pdf/guarantee-certificate"
import { createElement } from "react"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const user = await requireAuth()
  const { orderId } = await params

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true } },
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Only order owner or staff/admin can download
  if (
    order.userId !== user.id &&
    !["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Only allow for delivered orders
  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Guarantee certificate is only available for delivered orders" },
      { status: 400 },
    )
  }

  // Determine locale from query parameter or default
  const url = new URL(_req.url)
  const locale = url.searchParams.get("locale") === "fr" ? "fr" : "en"

  const props: GuaranteeCertificateProps = {
    customerName: order.user?.name ?? "Customer",
    orderNumber: order.orderNumber,
    purchaseDate: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productName: item.variant?.product?.name ?? "Product",
      variant: item.variant?.color ?? undefined,
      quantity: item.quantity,
    })),
    locale,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(GuaranteeCertificate, props) as any)

  return new Response(new Uint8Array(buffer as Buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="guarantee-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}
