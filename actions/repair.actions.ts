"use server"

import { db } from "@/server/db"
import { revalidatePath } from "next/cache"

export async function createRepairTicket(data: {
  customerId: string
  deviceDescription: string
  issueDescription: string
  branchId: string
}) {
  // TODO: Create repair ticket with RECEIVED status, send confirmation email
  void db
  void data
  return { success: true, ticketId: "" }
}

export async function updateRepairStatus(
  ticketId: string,
  status: string,
  note?: string
) {
  // TODO: Update status, add RepairStatusHistory entry, notify customer
  void db
  void ticketId
  void status
  void note
  revalidatePath("/[locale]/(dashboard)/(admin)/repairs", "page")
  return { success: true }
}

export async function assignTechnician(ticketId: string, technicianId: string) {
  // TODO: Assign technician to repair ticket
  void db
  void ticketId
  void technicianId
  return { success: true }
}
