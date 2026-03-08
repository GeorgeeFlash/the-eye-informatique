"use server"

import { db } from "@/server/db"
import { checkoutSchema } from "@/lib/validators/order.schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function createOrder(data: z.infer<typeof checkoutSchema>) {
  const parsed = checkoutSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Create order, reserve stock, initiate PayUnit checkout session
  void db
  return { success: true, orderId: "" }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string
) {
  // TODO: Update order status, add to OrderStatusHistory, send notification
  void db
  void orderId
  void status
  void note
  revalidatePath("/[locale]/(dashboard)/(admin)/orders", "page")
  return { success: true }
}

export async function cancelOrder(orderId: string) {
  // TODO: Cancel order, release stock, initiate refund if paid
  void db
  void orderId
  return { success: true }
}
