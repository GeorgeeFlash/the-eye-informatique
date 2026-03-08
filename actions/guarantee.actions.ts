"use server"

import { db } from "@/server/db"
import { requireAuth, requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"

function revalidateGuarantees() {
  revalidatePath("/[locale]/(dashboard)", "layout")
}

// ---------------------------------------------------------------------------
// getCustomerGuarantees — list all guarantee cards for the logged-in user
// ---------------------------------------------------------------------------

export async function getCustomerGuarantees() {
  const user = await requireAuth()

  return db.guaranteeCard.findMany({
    where: { userId: user.id },
    include: {
      orderItem: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          order: { select: { orderNumber: true, createdAt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

// ---------------------------------------------------------------------------
// getGuaranteeCard — single card with full details
// ---------------------------------------------------------------------------

export async function getGuaranteeCard(cardId: string) {
  const user = await requireAuth()

  const card = await db.guaranteeCard.findUnique({
    where: { id: cardId },
    include: {
      orderItem: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
          order: { select: { orderNumber: true, createdAt: true } },
        },
      },
      repairTickets: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, requestType: true, createdAt: true },
      },
    },
  })

  if (!card) return null
  if (card.userId !== user.id && !["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)) {
    return null
  }

  return card
}

// ---------------------------------------------------------------------------
// lookupGuarantee — public lookup by serial number (storefront page)
// ---------------------------------------------------------------------------

export async function lookupGuarantee(serialNumber: string) {
  const card = await db.guaranteeCard.findFirst({
    where: { serialNumber },
    include: {
      orderItem: {
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

  if (!card) return null

  return {
    serialNumber: card.serialNumber,
    productName: card.orderItem?.variant?.product?.name ?? "Unknown",
    warrantyMonths: card.warrantyMonths,
    purchaseDate: card.createdAt,
    expiresAt: card.expiresAt,
    isActive: card.expiresAt > new Date(),
  }
}

// ---------------------------------------------------------------------------
// createGuaranteeCards — auto-create cards when order is delivered (staff)
// ---------------------------------------------------------------------------

const DEFAULT_WARRANTY_MONTHS = 12

export async function createGuaranteeCards(
  orderId: string,
  warrantyMonths = DEFAULT_WARRANTY_MONTHS,
) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
          guaranteeCard: true,
        },
      },
    },
  })

  if (!order) return { error: "Order not found" }

  const cardsCreated: string[] = []

  for (const item of order.items) {
    // Skip items that already have a guarantee card
    if (item.guaranteeCard) continue

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + warrantyMonths)

    const serialNumber = generateSerialNumber()

    const card = await db.guaranteeCard.create({
      data: {
        orderItemId: item.id,
        userId: order.userId,
        serialNumber,
        warrantyMonths,
        expiresAt,
      },
    })

    cardsCreated.push(card.id)
  }

  revalidateGuarantees()
  return { success: true, cardsCreated: cardsCreated.length }
}

function generateSerialNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TEI-G-${ts}-${rand}`
}
