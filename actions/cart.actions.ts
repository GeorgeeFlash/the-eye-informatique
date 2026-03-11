"use server"

import { db } from "@/server/db"
import { getCurrentUser } from "@/lib/auth"
import type { CartItem } from "@/lib/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user.id
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's server-side cart and map rows to CartItem[].
 * Returns an empty array for unauthenticated visitors.
 */
export async function getServerCart(): Promise<CartItem[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const rows = await db.serverCartItem.findMany({
    where: { userId: user.id },
    select: {
      quantity: true,
      variant: {
        select: {
          id: true,
          sku: true,
          color: true,
          condition: true,
          price: true,
          stock: true,
          product: {
            select: {
              id: true,
              name: true,
              images: { select: { url: true }, where: { isPrimary: true }, take: 1 },
            },
          },
          stockByBranch: {
            select: {
              stock: true,
              branch: { select: { id: true, city: true } },
            },
            orderBy: { stock: "desc" as const },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return rows.map((r) => {
    const totalStock = r.variant.stockByBranch.reduce(
      (sum, s) => sum + s.stock,
      0,
    )
    const topBranch = r.variant.stockByBranch.find((s) => s.stock > 0)
    const conditionLabel = r.variant.condition === "NEW" ? "New" : "Refurbished"
    const label = [conditionLabel, r.variant.color].filter(Boolean).join(" — ")
    return {
      variantId: r.variant.id,
      productId: r.variant.product.id,
      productName: r.variant.product.name,
      variantLabel: label,
      sku: r.variant.sku,
      price: Number(r.variant.price),
      quantity: r.quantity,
      stockAvailable: totalStock,
      imageUrl: r.variant.product.images[0]?.url ?? undefined,
      branchId: topBranch?.branch.id,
      branchCity: topBranch?.branch.city,
    }
  })
}

// ─── Sync (bulk replace) ──────────────────────────────────────────────────────

/**
 * Replace the entire server cart with the given items.
 * Used after login to push the local cart to the server.
 */
export async function syncCartToServer(
  items: Pick<CartItem, "variantId" | "quantity">[],
): Promise<void> {
  const userId = await requireUserId()

  await db.$transaction(async (tx) => {
    await tx.serverCartItem.deleteMany({ where: { userId } })

    if (items.length > 0) {
      await tx.serverCartItem.createMany({
        data: items.map((i) => ({
          userId,
          variantId: i.variantId,
          quantity: Math.max(1, Math.floor(i.quantity)),
        })),
      })
    }
  })
}

// ─── Mutate single item ──────────────────────────────────────────────────────

export async function addServerCartItem(
  variantId: string,
  quantity: number,
): Promise<void> {
  const userId = await requireUserId()
  const qty = Math.max(1, Math.floor(quantity))

  await db.serverCartItem.upsert({
    where: { userId_variantId: { userId, variantId } },
    create: { userId, variantId, quantity: qty },
    update: { quantity: { increment: qty } },
  })
}

export async function removeServerCartItem(
  variantId: string,
): Promise<void> {
  const userId = await requireUserId()

  await db.serverCartItem.deleteMany({
    where: { userId, variantId },
  })
}

export async function updateServerCartItemQuantity(
  variantId: string,
  quantity: number,
): Promise<void> {
  const userId = await requireUserId()
  const qty = Math.max(1, Math.floor(quantity))

  await db.serverCartItem.updateMany({
    where: { userId, variantId },
    data: { quantity: qty },
  })
}

export async function clearServerCart(): Promise<void> {
  const userId = await requireUserId()
  await db.serverCartItem.deleteMany({ where: { userId } })
}
