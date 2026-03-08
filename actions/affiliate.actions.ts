"use server"

import { db } from "@/server/db"
import {
  affiliateApplicationSchema,
  affiliateLinkSchema,
} from "@/lib/validators/affiliate.schema"
import { requireAuth, requireRole } from "@/lib/auth"
import { createNotification } from "@/actions/notification.actions"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DEFAULT_PAGE_SIZE } from "@/lib/constants"

// ─── Customer: Apply ─────────────────────────────────────────────────

export async function applyForAffiliate(
  data: z.infer<typeof affiliateApplicationSchema>,
) {
  const user = await requireAuth()
  const parsed = affiliateApplicationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const existing = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
  })

  if (existing) {
    if (existing.status === "PENDING") return { error: "Application already pending." }
    if (existing.status === "APPROVED") return { error: "Already an affiliate." }
    if (
      existing.status === "REJECTED" &&
      existing.rejectedAt &&
      Date.now() - existing.rejectedAt.getTime() < 30 * 24 * 60 * 60 * 1000
    ) {
      return { error: "You may re-apply 30 days after rejection." }
    }
  }

  if (existing) {
    await db.affiliateProfile.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        payoutMethod: parsed.data.payoutMethod,
        payoutPhone: parsed.data.payoutPhone,
        rejectionReason: null,
        rejectedAt: null,
      },
    })
  } else {
    await db.affiliateProfile.create({
      data: {
        userId: user.id,
        payoutMethod: parsed.data.payoutMethod,
        payoutPhone: parsed.data.payoutPhone,
        status: "PENDING",
      },
    })
  }

  revalidatePath("/[locale]/(dashboard)/dashboard")
  return { success: true }
}

// ─── Customer: Get own profile ──────────────────────────────────────

export async function getMyAffiliateProfile() {
  const user = await requireAuth()
  return db.affiliateProfile.findUnique({
    where: { userId: user.id },
    include: {
      links: { orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  })
}

// ─── Customer: Create link ──────────────────────────────────────────

export async function createAffiliateLink(
  data: z.infer<typeof affiliateLinkSchema>,
) {
  const user = await requireAuth()
  const parsed = affiliateLinkSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile || profile.status !== "APPROVED") {
    return { error: "Affiliate profile not approved." }
  }

  const existing = await db.affiliateLink.findUnique({
    where: { code: parsed.data.code },
  })
  if (existing) return { error: "Code already taken." }

  const link = await db.affiliateLink.create({
    data: {
      affiliateId: profile.id,
      code: parsed.data.code,
      targetUrl: parsed.data.targetUrl,
    },
  })

  revalidatePath("/[locale]/(dashboard)/dashboard/(affiliate)/links")
  return { success: true, link }
}

// ─── Customer: Delete link ──────────────────────────────────────────

export async function deleteAffiliateLink(linkId: string) {
  const user = await requireAuth()
  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile) return { error: "Not an affiliate." }

  await db.affiliateLink.deleteMany({
    where: { id: linkId, affiliateId: profile.id },
  })

  revalidatePath("/[locale]/(dashboard)/dashboard/(affiliate)/links")
  return { success: true }
}

// ─── Customer: Get earnings summary ─────────────────────────────────

export async function getAffiliateEarnings() {
  const user = await requireAuth()
  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
    include: {
      links: true,
      referrals: { include: { link: true }, orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })
  if (!profile) return null

  const pendingCommission = await db.affiliateReferral.aggregate({
    where: { affiliateId: profile.id, status: "CONFIRMED" },
    _sum: { commission: true },
  })

  return {
    profile,
    pendingBalance: pendingCommission._sum.commission?.toNumber() ?? 0,
    totalEarned: profile.totalEarned.toNumber(),
    totalPaid: profile.totalPaid.toNumber(),
    referralCount: profile.referrals.length,
    totalClicks: profile.links.reduce((sum, l) => sum + l.clickCount, 0),
  }
}

// ─── Customer: Request payout ───────────────────────────────────────

export async function requestPayout() {
  const user = await requireAuth()
  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile || profile.status !== "APPROVED") {
    return { error: "Affiliate profile not approved." }
  }

  const pending = await db.affiliateReferral.aggregate({
    where: { affiliateId: profile.id, status: "CONFIRMED" },
    _sum: { commission: true },
  })
  const amount = pending._sum.commission?.toNumber() ?? 0
  if (amount <= 0) return { error: "No pending earnings." }

  await db.$transaction(async (tx) => {
    await tx.commissionPayout.create({
      data: {
        affiliateId: profile.id,
        amount,
        currency: "XAF",
        status: "PENDING",
      },
    })
    await tx.affiliateReferral.updateMany({
      where: { affiliateId: profile.id, status: "CONFIRMED" },
      data: { status: "PAID" },
    })
    await tx.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        totalPaid: { increment: amount },
      },
    })
  })

  revalidatePath("/[locale]/(dashboard)/dashboard/(affiliate)/earnings")
  return { success: true }
}

// ─── Admin: List affiliates ─────────────────────────────────────────

export async function getAdminAffiliates({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status,
}: {
  page?: number
  pageSize?: number
  status?: string
} = {}) {
  await requireRole(["ADMIN", "BRANCH_ADMIN"])

  const where = status ? { status: status as never } : {}

  const [affiliates, total] = await Promise.all([
    db.affiliateProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { referrals: true, links: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.affiliateProfile.count({ where }),
  ])

  return { affiliates, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── Admin: Get affiliate detail ────────────────────────────────────

export async function getAdminAffiliateDetail(profileId: string) {
  await requireRole(["ADMIN", "BRANCH_ADMIN"])

  return db.affiliateProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { name: true, email: true } },
      links: { orderBy: { createdAt: "desc" } },
      referrals: {
        include: { link: true, order: { select: { id: true, total: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  })
}

// ─── Admin: Approve ─────────────────────────────────────────────────

export async function approveAffiliate(profileId: string) {
  await requireRole(["ADMIN", "BRANCH_ADMIN"])

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: { status: "APPROVED" },
    include: { user: true },
  })

  await createNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    title: "Affiliate application approved!",
    body: "Your affiliate application has been approved. You can now generate referral links.",
    link: "/dashboard/affiliate/links",
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Admin: Reject ──────────────────────────────────────────────────

export async function rejectAffiliate(profileId: string, reason?: string) {
  await requireRole(["ADMIN", "BRANCH_ADMIN"])

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: {
      status: "REJECTED",
      rejectionReason: reason ?? null,
      rejectedAt: new Date(),
    },
    include: { user: true },
  })

  await createNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    title: "Affiliate application rejected",
    body: reason ?? "Your affiliate application was not approved at this time.",
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Admin: Suspend ─────────────────────────────────────────────────

export async function suspendAffiliate(profileId: string, reason: string) {
  await requireRole(["ADMIN", "BRANCH_ADMIN"])

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: {
      status: "SUSPENDED",
      suspensionReason: reason,
      suspendedAt: new Date(),
    },
    include: { user: true },
  })

  await createNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    title: "Affiliate account suspended",
    body: `Your affiliate account has been suspended. Reason: ${reason}`,
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Public: Track referral click ───────────────────────────────────

export async function trackAffiliateClick(code: string) {
  const link = await db.affiliateLink.findUnique({ where: { code } })
  if (!link) return null

  const affiliate = await db.affiliateProfile.findUnique({
    where: { id: link.affiliateId },
  })
  if (!affiliate || affiliate.status !== "APPROVED") return null

  await db.affiliateLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  })

  return { targetUrl: link.targetUrl, affiliateId: affiliate.id, linkId: link.id }
}

// ─── Internal: Record referral from order ───────────────────────────

export async function recordReferral(
  orderId: string,
  affiliateId: string,
  linkId: string,
  orderTotal: number,
) {
  const profile = await db.affiliateProfile.findUnique({
    where: { id: affiliateId },
  })
  if (!profile || profile.status !== "APPROVED") return

  const commission = orderTotal * profile.commissionRate.toNumber()

  await db.$transaction(async (tx) => {
    await tx.affiliateReferral.create({
      data: {
        linkId,
        affiliateId: profile.id,
        orderId,
        commission,
        status: "CONFIRMED",
      },
    })
    await tx.affiliateProfile.update({
      where: { id: profile.id },
      data: { totalEarned: { increment: commission } },
    })
  })

  await createNotification({
    userId: profile.userId,
    type: "COMMISSION",
    title: "New referral commission!",
    body: `You earned ${Math.round(commission)} XAF from a referral.`,
    link: "/dashboard/affiliate/earnings",
  })
}
