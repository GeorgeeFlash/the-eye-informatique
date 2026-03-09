"use server"

import { db } from "@/server/db"
import { checkoutSchema } from "@/lib/validators/order.schema"
import { requireAuth, requireRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { OrderStatus } from "@/lib/generated/prisma/client"
import { Prisma } from "@/lib/generated/prisma/client"
import { calculateShippingFee } from "@/lib/shipping"
import { createCheckoutSession } from "@/lib/payment"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TEI-${ts}-${rand}`
}

function revalidateOrders() {
  revalidatePath("/[locale]/(dashboard)", "layout")
  revalidatePath("/[locale]/(storefront)", "layout")
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartLineItem {
  variantId: string
  quantity: number
}

interface CreateOrderInput extends z.infer<typeof checkoutSchema> {
  items: CartLineItem[]
  newAddress?: {
    street: string
    city: string
    region: string
    country?: string
    label?: string
  }
}

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

export async function createOrder(data: CreateOrderInput) {
  const user = await requireAuth()

  // Validate checkout fields
  const parsed = checkoutSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  if (!data.items || data.items.length === 0) {
    return { error: { items: ["Cart is empty"] } }
  }

  // -----------------------------------------------------------------------
  // Resolve address for delivery
  // -----------------------------------------------------------------------
  let addressId = parsed.data.addressId ?? null
  let customerCity = ""

  if (parsed.data.deliveryMethod === "DELIVERY") {
    if (data.newAddress) {
      const addr = await db.address.create({
        data: {
          userId: user.id,
          street: data.newAddress.street,
          city: data.newAddress.city,
          region: data.newAddress.region,
          country: data.newAddress.country ?? "CM",
          label: data.newAddress.label,
        },
      })
      addressId = addr.id
      customerCity = addr.city
    } else if (addressId) {
      const addr = await db.address.findUnique({ where: { id: addressId } })
      if (!addr || addr.userId !== user.id) {
        return { error: { addressId: ["Invalid address"] } }
      }
      customerCity = addr.city
    } else {
      return { error: { addressId: ["Address required for delivery"] } }
    }
  }

  // -----------------------------------------------------------------------
  // Fetch variant details + stock
  // -----------------------------------------------------------------------
  const variantIds = data.items.map((i) => i.variantId)

  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { select: { id: true, name: true, isActive: true } },
      stockByBranch: {
        include: { branch: { select: { id: true, city: true } } },
        where: { stock: { gt: 0 } },
        orderBy: { stock: "desc" },
        take: 1,
      },
    },
  })

  // Map for quick lookup
  const variantMap = new Map(variants.map((v) => [v.id, v]))

  // Validate all items
  const errors: string[] = []
  let subtotal = 0
  let totalShipping = 0

  const lineItems: {
    variantId: string
    quantity: number
    unitPrice: number
    total: number
    fulfillmentBranchId: string
  }[] = []

  for (const item of data.items) {
    const variant = variantMap.get(item.variantId)
    if (!variant) {
      errors.push(`Variant ${item.variantId} not found`)
      continue
    }
    if (!variant.product.isActive) {
      errors.push(`${variant.product.name} is no longer available`)
      continue
    }

    // Find a branch with stock
    const stockRecord = variant.stockByBranch[0]
    if (!stockRecord || stockRecord.stock < item.quantity) {
      errors.push(
        `Insufficient stock for ${variant.product.name} (${variant.sku})`,
      )
      continue
    }

    const price = Number(variant.price)
    const lineTotal = price * item.quantity
    subtotal += lineTotal

    // Shipping fee per line (delivery only)
    if (parsed.data.deliveryMethod === "DELIVERY" && customerCity) {
      totalShipping += calculateShippingFee(customerCity, stockRecord.branch.city)
    }

    lineItems.push({
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice: price,
      total: lineTotal,
      fulfillmentBranchId: stockRecord.branch.id,
    })
  }

  if (errors.length > 0) {
    return { error: { items: errors } }
  }

  const total = subtotal + totalShipping

  // -----------------------------------------------------------------------
  // Create order + decrement stock in a transaction
  // -----------------------------------------------------------------------
  const order = await db.$transaction(async (tx) => {
    // Atomic stock decrement for each line item
    for (const line of lineItems) {
      const updated = await tx.productStockByBranch.updateMany({
        where: {
          variantId: line.variantId,
          branchId: line.fulfillmentBranchId,
          stock: { gte: line.quantity },
        },
        data: { stock: { decrement: line.quantity } },
      })
      if (updated.count === 0) {
        throw new Error(`Stock no longer available for variant ${line.variantId}`)
      }
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: "PENDING",
        subtotal,
        deliveryFee: totalShipping,
        total,
        deliveryMethod: parsed.data.deliveryMethod,
        addressId,
        branchId: parsed.data.branchId ?? lineItems[0]?.fulfillmentBranchId,
        notes: parsed.data.notes,
        items: {
          create: lineItems.map((li) => ({
            variantId: li.variantId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            total: li.total,
            fulfillmentBranchId: li.fulfillmentBranchId,
          })),
        },
        statusHistory: {
          create: {
            status: "PENDING",
            changedBy: user.id,
            note: "Order placed",
          },
        },
        payment: {
          create: {
            method: parsed.data.paymentMethod,
            gateway: parsed.data.gateway ?? null,
            amount: total,
            status: "PENDING",
          },
        },
      },
    })

    // Create installment records if requested
    if (parsed.data.installments) {
      const installmentCount = 3
      const installmentAmount = Math.ceil(total / installmentCount)

      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i + 1)

        await tx.installment.create({
          data: {
            orderId: newOrder.id,
            sequenceNumber: i + 1,
            amount:
              i === installmentCount - 1
                ? total - installmentAmount * (installmentCount - 1)
                : installmentAmount,
            dueDate,
          },
        })
      }
    }

    return newOrder
  }).catch((e: unknown) => {
    // Surface a user-friendly message on order-number collision (P2002 unique violation).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Order number conflict — please try again.")
    }
    throw e
  })

  revalidateOrders()

  // Initiate PayUnit checkout session.
  // user.name / user.email are already available from requireAuth() above.
  try {
    const session = await createCheckoutSession({
      orderId: order.id,
      amount: total,
      gateway: parsed.data.gateway ?? "CM_MTNMOMO",
      customerName: user.name ?? undefined,
      customerEmail: user.email,
    })

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: session.redirectUrl,
    }
  } catch {
    // Order is created — payment can be retried
    return { success: true, orderId: order.id, orderNumber: order.orderNumber }
  }
}

// ---------------------------------------------------------------------------
// getOrder — single order with full details
// ---------------------------------------------------------------------------

export async function getOrder(orderId: string) {
  const user = await requireAuth()

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          fulfillmentBranch: { select: { id: true, name: true, city: true } },
          guaranteeCard: { select: { id: true, serialNumber: true, expiresAt: true, warrantyMonths: true } },
        },
      },
      payment: true,
      installments: { orderBy: { sequenceNumber: "asc" } },
      address: true,
      branch: { select: { id: true, name: true, city: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedByUser: { select: { name: true, role: true } } },
      },
    },
  })

  if (!order) return null

  // Customers can only see their own orders; staff+ can see any
  if (order.userId !== user.id && !["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)) {
    return null
  }

  return order
}

// ---------------------------------------------------------------------------
// getOrders — paginated list
// ---------------------------------------------------------------------------

interface GetOrdersParams {
  userId?: string
  status?: OrderStatus
  branchId?: string
  page?: number
  pageSize?: number
}

export async function getOrders({
  userId,
  status,
  branchId,
  page = 1,
  pageSize = 20,
}: GetOrdersParams = {}) {
  const user = await requireAuth()

  // Customers only see their own orders
  const effectiveUserId =
    ["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)
      ? userId
      : user.id

  const where = {
    ...(effectiveUserId && { userId: effectiveUserId }),
    ...(status && { status }),
    ...(branchId && { branchId }),
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true, images: { where: { isPrimary: true }, take: 1 } },
                },
              },
            },
          },
        },
        payment: { select: { status: true, method: true } },
        _count: { select: { installments: true, items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ])

  return { orders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ---------------------------------------------------------------------------
// getCustomerOrders — convenience for customer dashboard
// ---------------------------------------------------------------------------

export async function getCustomerOrders(page = 1, pageSize = 10) {
  const user = await requireAuth()
  return getOrders({ userId: user.id, page, pageSize })
}

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { error: "Order not found" }

  // Branch scoping: staff can only manage orders from their branch
  if (
    user.role !== "CENTRAL_ADMIN" &&
    user.branchId &&
    order.branchId !== user.branchId
  ) {
    return { error: "Access denied" }
  }

  // Map order status → item fulfillment status where applicable
  const fulfillmentStatusMap: Partial<Record<OrderStatus, "SHIPPED" | "DELIVERED">> = {
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
  }
  const newFulfillmentStatus = fulfillmentStatusMap[status]

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { status },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        status,
        note,
        changedBy: user.id,
      },
    }),
    ...(newFulfillmentStatus
      ? [
          db.orderItem.updateMany({
            where: { orderId },
            data: { fulfillmentStatus: newFulfillmentStatus },
          }),
        ]
      : []),
  ])

  revalidateOrders()
  return { success: true }
}

// ---------------------------------------------------------------------------
// cancelOrder
// ---------------------------------------------------------------------------

export async function cancelOrder(orderId: string) {
  const user = await requireAuth()

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) return { error: "Order not found" }

  // Only order owner or staff+ can cancel
  if (
    order.userId !== user.id &&
    !["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)
  ) {
    return { error: "Access denied" }
  }

  // Can only cancel PENDING or CONFIRMED orders
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    return { error: "Order cannot be cancelled at this stage" }
  }

  await db.$transaction(async (tx) => {
    // Restore stock
    for (const item of order.items) {
      if (item.fulfillmentBranchId) {
        await tx.productStockByBranch.updateMany({
          where: {
            variantId: item.variantId,
            branchId: item.fulfillmentBranchId,
          },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CANCELLED",
        changedBy: user.id,
        note: "Order cancelled",
      },
    })
  })

  revalidateOrders()
  return { success: true }
}

// ---------------------------------------------------------------------------
// getUserAddresses
// ---------------------------------------------------------------------------

export async function getUserAddresses() {
  const user = await requireAuth()
  return db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
}

// ---------------------------------------------------------------------------
// retryPayment — create a new PayUnit session for an unpaid order
// ---------------------------------------------------------------------------

export async function retryPayment(orderId: string, gateway: string) {
  const user = await requireAuth()

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order) return { error: "Order not found" }
  if (order.userId !== user.id) return { error: "Access denied" }
  if (order.status !== "PENDING") return { error: "Order is not pending payment" }
  if (order.payment?.status === "SUCCESS") return { error: "Already paid" }

  const userInfo = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  })

  const session = await createCheckoutSession({
    orderId: order.id,
    amount: Number(order.total),
    gateway,
    customerName: userInfo?.name ?? undefined,
    customerEmail: userInfo?.email ?? undefined,
  })

  return { success: true, redirectUrl: session.redirectUrl }
}

// ---------------------------------------------------------------------------
// payInstallment — create a PayUnit session for a specific installment
// ---------------------------------------------------------------------------

export async function payInstallment(installmentId: string, gateway: string) {
  const user = await requireAuth()

  const installment = await db.installment.findUnique({
    where: { id: installmentId },
    include: { order: true },
  })

  if (!installment) return { error: "Installment not found" }
  if (installment.order.userId !== user.id) return { error: "Access denied" }
  if (installment.status === "PAID") return { error: "Already paid" }

  const userInfo = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  })

  const session = await createCheckoutSession({
    orderId: installment.orderId,
    amount: Number(installment.amount),
    gateway,
    customerName: userInfo?.name ?? undefined,
    customerEmail: userInfo?.email ?? undefined,
    installmentId: installment.id,
  })

  return { success: true, redirectUrl: session.redirectUrl }
}
