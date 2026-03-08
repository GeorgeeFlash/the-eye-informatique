"use server"

import { db } from "@/server/db"
import { profileSchema } from "@/lib/validators/auth.schema"
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Role } from "@/lib/types"

// ---------------------------------------------------------------------------
// Complete Registration — called after Clerk sign-up
// ---------------------------------------------------------------------------
const completeRegistrationSchema = z.object({
  applyAsAffiliate: z.boolean().default(false),
  branchId: z.string().cuid().optional(),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "You must accept the terms and privacy policy",
  }),
})

export type CompleteRegistrationInput = z.infer<typeof completeRegistrationSchema>

export async function completeRegistration(data: CompleteRegistrationInput) {
  const parsed = completeRegistrationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const user = await requireAuth()
  const { applyAsAffiliate, branchId } = parsed.data

  // If affiliate toggle is on, branchId is required
  if (applyAsAffiliate && !branchId) {
    return { error: { fieldErrors: { branchId: ["Branch selection is required for affiliate application"] }, formErrors: [] } }
  }

  // Validate branch exists if provided
  if (branchId) {
    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return { error: { fieldErrors: { branchId: ["Invalid branch"] }, formErrors: [] } }
    }
  }

  await db.$transaction(async (tx) => {
    // Ensure user has CUSTOMER role
    await tx.user.update({
      where: { id: user.id },
      data: { role: "CUSTOMER" },
    })

    // Create affiliate profile if requested
    if (applyAsAffiliate) {
      await tx.affiliateProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          status: "PENDING",
        },
        update: {},
      })
    }
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// Update Profile
// ---------------------------------------------------------------------------
export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const user = await requireAuth()

  await db.user.update({
    where: { id: user.id },
    data: {
      name: stripHtml(parsed.data.name),
      phone: parsed.data.phone || null,
      preferredLocale: parsed.data.preferredLocale,
    },
  })

  revalidatePath("/[locale]/(dashboard)")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Assign Role — Central Admin only (AC-M1.2-7)
// ---------------------------------------------------------------------------
const VALID_ROLES: Role[] = ["CUSTOMER", "AFFILIATE", "STAFF", "ADMIN", "CENTRAL_ADMIN"]

const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["CUSTOMER", "AFFILIATE", "STAFF", "ADMIN", "CENTRAL_ADMIN"]),
  branchId: z.string().cuid().optional(),
})

export async function assignRole(data: z.infer<typeof assignRoleSchema>) {
  const parsed = assignRoleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  await requireRole(["CENTRAL_ADMIN"])

  const { userId, role, branchId } = parsed.data

  // Staff and Admin roles require a branch
  if ((role === "STAFF" || role === "ADMIN") && !branchId) {
    return { error: { fieldErrors: { branchId: ["Branch is required for staff/admin roles"] }, formErrors: [] } }
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return { error: { formErrors: ["User not found"], fieldErrors: {} } }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      role,
      branchId: (role === "STAFF" || role === "ADMIN") ? branchId : null,
    },
  })

  revalidatePath("/[locale]/(dashboard)/admin/users")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Add User Remark — Staff+ only (AC-M1.2-9)
// ---------------------------------------------------------------------------
const addRemarkSchema = z.object({
  userId: z.string().cuid(),
  text: z.string().min(1).max(2000),
})

export async function addUserRemark(data: z.infer<typeof addRemarkSchema>) {
  const parsed = addRemarkSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const currentUser = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const targetUser = await db.user.findUnique({ where: { id: parsed.data.userId } })
  if (!targetUser) {
    return { error: { formErrors: ["User not found"], fieldErrors: {} } }
  }

  // Store remark as an activity log entry
  await db.activityLog.create({
    data: {
      userId: currentUser.id,
      action: "USER_REMARK",
      entityType: "User",
      entityId: parsed.data.userId,
      metadata: {
        text: stripHtml(parsed.data.text),
        authorName: currentUser.name,
        authorRole: currentUser.role,
      },
    },
  })

  revalidatePath(`/[locale]/(dashboard)/admin/users/${parsed.data.userId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Get User Remarks — Staff+ only
// ---------------------------------------------------------------------------
export async function getUserRemarks(userId: string) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const remarks = await db.activityLog.findMany({
    where: {
      action: "USER_REMARK",
      entityType: "User",
      entityId: userId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      metadata: true,
      createdAt: true,
    },
  })

  return remarks
}

// ---------------------------------------------------------------------------
// Delete User — GDPR anonymization (Central Admin only)
// ---------------------------------------------------------------------------
export async function deleteUser(userId: string) {
  await requireRole(["CENTRAL_ADMIN"])

  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return { error: "User not found" }
  }

  // Anonymize instead of hard delete — preserve order history
  await db.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@anonymized.local`,
      name: null,
      phone: null,
      isActive: false,
    },
  })

  revalidatePath("/[locale]/(dashboard)/admin/users")
  return { success: true }
}

// ---------------------------------------------------------------------------
// Get Users List — Staff+ only
// ---------------------------------------------------------------------------
export async function getUsers(params?: {
  search?: string
  role?: Role
  page?: number
  pageSize?: number
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  const { search, role, page = 1, pageSize = 20 } = params ?? {}
  const skip = (page - 1) * pageSize

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role }),
    isActive: true,
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        branch: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])

  return { users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ---------------------------------------------------------------------------
// Get Branches — public (for sign-up affiliate selector, etc.)
// ---------------------------------------------------------------------------
export async function getBranches() {
  return db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  })
}
