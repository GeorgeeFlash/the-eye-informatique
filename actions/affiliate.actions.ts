"use server"

import { db } from "@/server/db"
import {
  affiliateApplicationSchema,
  affiliateLinkSchema,
} from "@/lib/validators/affiliate.schema"
import { requireAuth, requireRole } from "@/lib/auth"
import { createNotification } from "@/actions/notification.actions"
import { createLocalizedNotification } from "@/lib/notifications"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { APP_URL, DEFAULT_PAGE_SIZE } from "@/lib/constants"
import { createDisbursement, confirmDisbursement } from "@/server/payunit"
import { inngest } from "@/server/inngest/client"
import type { AuthUser } from "@/lib/auth"
import { payoutPreferenceSchema } from "@/lib/validators/affiliate.schema"
import { logActivity } from "@/lib/activity-log"

// ─── Helper: verify admin can access this affiliate ─────────────────

async function verifyBranchAccess(admin: AuthUser, profileId: string) {
  if (admin.role === "ADMIN" && admin.branchId) {
    const profile = await db.affiliateProfile.findUnique({
      where: { id: profileId },
      select: { branchId: true },
    })
    if (profile?.branchId !== admin.branchId) {
      throw new Error("Access denied")
    }
  }
}

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
    if (existing.status === "SUSPENDED") return { error: "Your affiliate account has been suspended. Please contact support." }
    if (existing.status === "REVOKED") return { error: "Your affiliate account has been permanently revoked." }
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
        branchId: parsed.data.branchId,
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
        branchId: parsed.data.branchId,
        status: "PENDING",
      },
    })
  }

  logActivity({
    action: "AFFILIATE_APPLICATION_SUBMITTED",
    entityType: "AffiliateProfile",
    entityId: user.id,
    metadata: { payoutMethod: parsed.data.payoutMethod, branchId: parsed.data.branchId ?? null },
  })

  // Notify admins about new application
  const admins = await db.user.findMany({
    where: {
      role: { in: ["ADMIN", "CENTRAL_ADMIN"] },
      isActive: true,
      ...(parsed.data.branchId ? { OR: [{ branchId: parsed.data.branchId }, { role: "CENTRAL_ADMIN" }] } : {}),
    },
    select: { id: true },
  })
  for (const admin of admins) {
    void createLocalizedNotification({
      userId: admin.id,
      type: "AFFILIATE_APPLICATION",
      messageKey: "affiliateApplicationReceived",
      params: { applicantName: user.name ?? user.email ?? "User" },
      link: "/admin/affiliates",
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

  const payoutId = `PAYOUT-${Date.now().toString(36).toUpperCase()}`

  // Create a PayUnit disbursement to the affiliate's mobile money account
  const disbursement = await createDisbursement({
    amount,
    accountNumber: profile.payoutPhone ?? "",
    beneficiaryName: user.name ?? "Affiliate",
    gateway: profile.payoutMethod === "ORANGE" ? "CM_ORANGE" : "CM_MTNMOMO",
    transactionId: payoutId,
  })

  // Confirm the disbursement
  await confirmDisbursement({
    payToken: disbursement.pay_token,
    message: `Affiliate commission payout ${payoutId}`,
    notifyUrl: `${APP_URL}/api/webhooks/payunit`,
  })

  await db.$transaction(async (tx) => {
    await tx.commissionPayout.create({
      data: {
        affiliateId: profile.id,
        amount,
        currency: "XAF",
        status: "PENDING",
        payunitDisbursementId: disbursement.pay_token,
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

// ─── Customer: Update payout preference ─────────────────────────────

export async function updatePayoutPreference(
  data: z.infer<typeof payoutPreferenceSchema>,
) {
  const user = await requireAuth()
  const parsed = payoutPreferenceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile || profile.status !== "APPROVED") {
    return { error: "Affiliate profile not approved." }
  }

  await db.affiliateProfile.update({
    where: { id: profile.id },
    data: { payoutPreference: parsed.data.preference },
  })

  revalidatePath("/[locale]/(dashboard)/dashboard/(affiliate)/payouts")
  return { success: true }
}

// ─── Admin: List affiliates ─────────────────────────────────────────

export async function getAdminAffiliates({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
  branchId,
}: {
  page?: number
  pageSize?: number
  status?: string
  sortBy?: "createdAt" | "totalEarned" | "status"
  sortOrder?: "asc" | "desc"
  branchId?: string
} = {}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  // Build where clause with branch scoping
  const where: Record<string, unknown> = {}
  if (status) where.status = status

  if (admin.role === "ADMIN" && admin.branchId) {
    // Branch admin sees only their branch's affiliates
    where.branchId = admin.branchId
  } else if (branchId) {
    // Central admin can filter by branch
    where.branchId = branchId
  }

  const orderBy = { [sortBy]: sortOrder }

  const [affiliates, total] = await Promise.all([
    db.affiliateProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        branch: { select: { name: true, city: true } },
        _count: { select: { referrals: true, links: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.affiliateProfile.count({ where }),
  ])

  return { affiliates, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── Admin: Get affiliate detail ────────────────────────────────────

export async function getAdminAffiliateDetail(profileId: string) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])

  const profile = await db.affiliateProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { name: true, email: true } },
      branch: { select: { name: true, city: true } },
      links: { orderBy: { createdAt: "desc" } },
      referrals: {
        include: { link: true, order: { select: { id: true, total: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  })

  // Branch admin can only view their branch's affiliates
  if (admin.role === "ADMIN" && admin.branchId && profile?.branchId !== admin.branchId) {
    throw new Error("Access denied")
  }

  return profile
}

// ─── Admin: Approve ─────────────────────────────────────────────────

export async function approveAffiliate(profileId: string) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])
  await verifyBranchAccess(admin, profileId)

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: { status: "APPROVED" },
    include: { user: true },
  })

  await createLocalizedNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    messageKey: "affiliateApproved",
    link: "/dashboard/affiliate/links",
  })

  // Send welcome email
  await inngest.send({
    id: `welcome-email-${profile.user.id}`,
    name: "email/send",
    data: {
      to: profile.user.email,
      subject: "Welcome to the Affiliate Program!",
      template: "affiliate-welcome" as const,
      messageId: `welcome-${profile.user.id}`,
      props: {
        affiliateName: profile.user.name ?? "Affiliate",
        commissionRate: Number(profile.commissionRate) * 100,
        dashboardUrl: `${APP_URL}/dashboard/affiliate/links`,
      },
    },
  })

  logActivity({
    action: "AFFILIATE_APPROVED",
    entityType: "AffiliateProfile",
    entityId: profileId,
    metadata: { userId: profile.userId },
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Admin: Reject ──────────────────────────────────────────────────

export async function rejectAffiliate(profileId: string, reason?: string) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])
  await verifyBranchAccess(admin, profileId)

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: {
      status: "REJECTED",
      rejectionReason: reason ?? null,
      rejectedAt: new Date(),
    },
    include: { user: true },
  })

  await createLocalizedNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    messageKey: "affiliateRejected",
  })

  logActivity({
    action: "AFFILIATE_REJECTED",
    entityType: "AffiliateProfile",
    entityId: profileId,
    metadata: { userId: profile.userId, reason: reason ?? null },
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Admin: Suspend ─────────────────────────────────────────────────

export async function suspendAffiliate(profileId: string, reason: string) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])
  await verifyBranchAccess(admin, profileId)

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: {
      status: "SUSPENDED",
      suspensionReason: reason,
      suspendedAt: new Date(),
    },
    include: { user: true },
  })

  await createLocalizedNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    messageKey: "affiliateSuspended",
    params: { reason },
  })

  logActivity({
    action: "AFFILIATE_SUSPENDED",
    entityType: "AffiliateProfile",
    entityId: profileId,
    metadata: { userId: profile.userId, reason },
  })

  revalidatePath("/[locale]/(dashboard)/admin/(admin)/affiliates")
  return { success: true }
}

// ─── Admin: Revoke (terminal) ───────────────────────────────────────

export async function revokeAffiliate(profileId: string, reason: string) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"])
  await verifyBranchAccess(admin, profileId)

  const profile = await db.affiliateProfile.update({
    where: { id: profileId },
    data: {
      status: "REVOKED",
      suspensionReason: reason,
      revokedAt: new Date(),
    },
    include: { user: true },
  })

  // Deactivate all promotional links by deleting them
  await db.affiliateLink.deleteMany({
    where: { affiliateId: profileId },
  })

  await createLocalizedNotification({
    userId: profile.userId,
    type: "AFFILIATE_APPLICATION",
    messageKey: "affiliateRevoked",
    params: { reason },
  })

  logActivity({
    action: "AFFILIATE_REVOKED",
    entityType: "AffiliateProfile",
    entityId: profileId,
    metadata: { userId: profile.userId, reason },
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

/**
 * Called after payment confirmation. Finds the PENDING AffiliateReferral
 * on the order, calculates commission per line item using product-level
 * rates with fallback to the affiliate's default rate, then confirms it.
 */
export async function confirmReferralCommission(orderId: string) {
  const referral = await db.affiliateReferral.findUnique({
    where: { orderId },
    include: {
      affiliate: { select: { id: true, userId: true, status: true, commissionRate: true, payoutPreference: true } },
    },
  })

  if (!referral || referral.status !== "PENDING") return
  if (!referral.affiliate || referral.affiliate.status !== "APPROVED") return

  // Fetch order line items with product commission info
  const orderItems = await db.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        include: {
          product: { select: { commissionType: true, commissionValue: true } },
        },
      },
    },
  })

  const affiliateRate = referral.affiliate.commissionRate.toNumber()

  // Calculate commission per line item
  let totalCommission = 0
  for (const item of orderItems) {
    const lineTotal = Number(item.total)
    const product = item.variant?.product

    if (product?.commissionType && product.commissionValue) {
      const cv = Number(product.commissionValue)
      if (product.commissionType === "FIXED") {
        totalCommission += cv * item.quantity
      } else {
        // PERCENTAGE
        totalCommission += lineTotal * cv
      }
    } else {
      // Fallback to affiliate's default commission rate
      totalCommission += lineTotal * affiliateRate
    }
  }

  totalCommission = Math.round(totalCommission)
  if (totalCommission <= 0) return

  await db.$transaction(async (tx) => {
    await tx.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        commission: totalCommission,
        status: "CONFIRMED",
      },
    })
    await tx.affiliateProfile.update({
      where: { id: referral.affiliate.id },
      data: { totalEarned: { increment: totalCommission } },
    })
  })

  await createNotification({
    userId: referral.affiliate.userId,
    type: "COMMISSION",
    title: "New referral commission!",
    body: `You earned ${totalCommission} FCFA from a referral.`,
    link: "/dashboard/affiliate/earnings",
  })

  // If affiliate prefers immediate payout, trigger it
  if (referral.affiliate.payoutPreference === "IMMEDIATE") {
    await inngest.send({
      id: `immediate-payout-${referral.id}`,
      name: "affiliate/immediate-payout",
      data: { referralId: referral.id, affiliateId: referral.affiliate.id },
    })
  }
}

// ─── Customer / Affiliate: Get or create product affiliate link ────────

export async function getOrCreateProductAffiliateLink(productSlugOrId: string) {
  try {
    const user = await requireAuth()
    const profile = await db.affiliateProfile.findUnique({
      where: { userId: user.id },
    })

    if (!profile || profile.status !== "APPROVED") {
      return { isAffiliate: false, url: null, code: null }
    }

    const product = await db.product.findFirst({
      where: {
        OR: [{ id: productSlugOrId }, { slug: productSlugOrId }],
      },
      select: { id: true, slug: true, name: true },
    })

    if (!product) {
      return { isAffiliate: false, url: null, code: null }
    }

    const targetUrl = `/products/${product.slug}`

    // Check if link already exists for this affiliate & target
    let link = await db.affiliateLink.findFirst({
      where: { affiliateId: profile.id, targetUrl },
    })

    if (!link) {
      // Generate a clean deterministic/random unique code
      const cleanSlug = product.slug.slice(0, 8).replace(/[^a-zA-Z0-9]/g, "")
      const randSuffix = Math.random().toString(36).substring(2, 6)
      const code = `${cleanSlug}-${randSuffix}`.toLowerCase()

      link = await db.affiliateLink.create({
        data: {
          affiliateId: profile.id,
          code,
          targetUrl,
        },
      })
    }

    return {
      isAffiliate: true,
      code: link.code,
      url: `${APP_URL}/ref/${link.code}`,
    }
  } catch {
    return { isAffiliate: false, url: null, code: null }
  }
}

