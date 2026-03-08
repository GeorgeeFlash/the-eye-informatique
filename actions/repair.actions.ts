"use server"

import { db } from "@/server/db"
import { revalidatePath } from "next/cache"
import { requireAuth, requireRole } from "@/lib/auth"
import {
  createRepairTicketSchema,
  updateRepairStatusSchema,
  type CreateRepairTicketValues,
} from "@/lib/validators/repair.schema"
import type { RepairStatus } from "@prisma/client"

function revalidateRepairs() {
  revalidatePath("/[locale]/(dashboard)", "layout")
}

// ---------------------------------------------------------------------------
// createRepairTicket — customer submits a repair/return/exchange request
// ---------------------------------------------------------------------------

export async function createRepairTicket(data: CreateRepairTicketValues) {
  const user = await requireAuth()

  const parsed = createRepairTicketSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // If guarantee card is provided, verify it belongs to the user
  if (parsed.data.guaranteeCardId) {
    const card = await db.guaranteeCard.findUnique({
      where: { id: parsed.data.guaranteeCardId },
    })
    if (!card || card.userId !== user.id) {
      return { error: { guaranteeCardId: ["Invalid guarantee card"] } }
    }
    if (card.expiresAt < new Date()) {
      return { error: { guaranteeCardId: ["Guarantee has expired"] } }
    }
  }

  const ticket = await db.$transaction(async (tx) => {
    const newTicket = await tx.repairTicket.create({
      data: {
        userId: user.id,
        requestType: parsed.data.requestType,
        issueDescription: parsed.data.issueDescription,
        productId: parsed.data.productId,
        guaranteeCardId: parsed.data.guaranteeCardId,
        branchId: parsed.data.branchId,
        priority: parsed.data.priority,
      },
    })

    await tx.repairStatusHistory.create({
      data: {
        ticketId: newTicket.id,
        status: "SUBMITTED",
        note: "Ticket created",
        changedBy: user.id,
      },
    })

    return newTicket
  })

  revalidateRepairs()
  return { success: true, ticketId: ticket.id }
}

// ---------------------------------------------------------------------------
// getRepairTickets — paginated list (customers see own, staff see branch)
// ---------------------------------------------------------------------------

interface GetRepairTicketsParams {
  status?: RepairStatus
  page?: number
  pageSize?: number
}

export async function getRepairTickets({
  status,
  page = 1,
  pageSize = 20,
}: GetRepairTicketsParams = {}) {
  const user = await requireAuth()

  const isStaff = ["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)

  const where = {
    ...(!isStaff && { userId: user.id }),
    ...(isStaff && user.role !== "CENTRAL_ADMIN" && user.branchId && { branchId: user.branchId }),
    ...(status && { status }),
  }

  const [tickets, total] = await Promise.all([
    db.repairTicket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
        guaranteeCard: { select: { serialNumber: true, expiresAt: true } },
        branch: { select: { name: true, city: true } },
        assignee: { select: { name: true } },
        _count: { select: { attachments: true, statusHistory: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.repairTicket.count({ where }),
  ])

  return { tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ---------------------------------------------------------------------------
// getRepairTicket — single ticket with full details
// ---------------------------------------------------------------------------

export async function getRepairTicket(ticketId: string) {
  const user = await requireAuth()

  const ticket = await db.repairTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
      guaranteeCard: { select: { serialNumber: true, expiresAt: true, warrantyMonths: true } },
      branch: { select: { id: true, name: true, city: true } },
      assignee: { select: { id: true, name: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedByUser: { select: { name: true, role: true } } },
      },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  })

  if (!ticket) return null

  // Customers can only see their own tickets; staff+ can see any
  if (ticket.userId !== user.id && !["STAFF", "ADMIN", "CENTRAL_ADMIN"].includes(user.role)) {
    return null
  }

  return ticket
}

// ---------------------------------------------------------------------------
// updateRepairStatus — staff updates status with history
// ---------------------------------------------------------------------------

export async function updateRepairStatus(
  ticketId: string,
  data: { status: string; note?: string },
) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const parsed = updateRepairStatusSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const ticket = await db.repairTicket.findUnique({ where: { id: ticketId } })
  if (!ticket) return { error: "Ticket not found" }

  // Branch scoping
  if (user.role !== "CENTRAL_ADMIN" && user.branchId && ticket.branchId !== user.branchId) {
    return { error: "Access denied" }
  }

  await db.$transaction([
    db.repairTicket.update({
      where: { id: ticketId },
      data: { status: parsed.data.status },
    }),
    db.repairStatusHistory.create({
      data: {
        ticketId,
        status: parsed.data.status,
        note: parsed.data.note,
        changedBy: user.id,
      },
    }),
  ])

  revalidateRepairs()
  return { success: true }
}

// ---------------------------------------------------------------------------
// assignTechnician — assign a staff member to a ticket
// ---------------------------------------------------------------------------

export async function assignTechnician(ticketId: string, technicianId: string) {
  const user = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const ticket = await db.repairTicket.findUnique({ where: { id: ticketId } })
  if (!ticket) return { error: "Ticket not found" }

  if (user.role !== "CENTRAL_ADMIN" && user.branchId && ticket.branchId !== user.branchId) {
    return { error: "Access denied" }
  }

  await db.repairTicket.update({
    where: { id: ticketId },
    data: { assignedTo: technicianId },
  })

  revalidateRepairs()
  return { success: true }
}
