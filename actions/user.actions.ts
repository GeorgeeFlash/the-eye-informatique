"use server"

import { db } from "@/server/db"
import { profileSchema } from "@/lib/validators/auth.schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function updateProfile(
  userId: string,
  data: z.infer<typeof profileSchema>
) {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Update user name, phone in db; sync relevant fields to Clerk
  void db
  void userId
  revalidatePath("/[locale]/(dashboard)/(customer)/settings", "page")
  return { success: true }
}

export async function assignRole(userId: string, role: string) {
  // TODO: Update user role — central admin only
  void db
  void userId
  void role
  revalidatePath("/[locale]/(dashboard)/(central-admin)/users", "page")
  return { success: true }
}

export async function deleteUser(userId: string) {
  // TODO: Anonymize user data (GDPR) — set email/name to null, keep orders
  void db
  void userId
  return { success: true }
}
