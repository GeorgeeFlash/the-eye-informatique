"use server"

import { db } from "@/server/db"
import {
  affiliateApplicationSchema,
  affiliateLinkSchema,
} from "@/lib/validators/affiliate.schema"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function applyForAffiliate(data: z.infer<typeof affiliateApplicationSchema>) {
  const parsed = affiliateApplicationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Create AffiliateProfile with PENDING status, send email to admin
  void db
  return { success: true }
}

export async function approveAffiliate(profileId: string) {
  // TODO: Set status ACTIVE, send welcome email via Inngest
  void db
  void profileId
  revalidatePath("/[locale]/(dashboard)/(admin)/affiliates", "page")
  return { success: true }
}

export async function rejectAffiliate(profileId: string, reason?: string) {
  // TODO: Set status REJECTED, notify applicant
  void db
  void profileId
  void reason
  return { success: true }
}

export async function createAffiliateLink(
  profileId: string,
  data: z.infer<typeof affiliateLinkSchema>
) {
  const parsed = affiliateLinkSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // TODO: Generate unique short link, save to AffiliateLink
  void db
  void profileId
  return { success: true, link: "" }
}

export async function requestPayout(profileId: string) {
  // TODO: Create CommissionPayout with PENDING status
  void db
  void profileId
  return { success: true }
}
