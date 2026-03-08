import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/server/db"
import { redirect } from "next/navigation"
import type { Role } from "@/lib/types"

export type AuthUser = {
  id: string
  clerkId: string
  email: string
  name: string | null
  role: Role
  branchId: string | null
  isActive: boolean
}

/**
 * Get the current platform user from the database (not just Clerk session).
 * Returns null if the user is not authenticated or doesn't exist in our DB yet.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      branchId: true,
      isActive: true,
    },
  })

  return user as AuthUser | null
}

/**
 * Require the current user to be authenticated and have one of the allowed roles.
 * Redirects to sign-in if not authenticated, returns 403 if role not matched.
 */
export async function requireRole(
  allowedRoles: Role[],
): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated")
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Access denied")
  }

  return user
}

/**
 * Require authentication without role restriction.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/sign-in")
  }
  if (!user.isActive) {
    throw new Error("Account is deactivated")
  }
  return user
}

/**
 * Check if the current user has at least the given role level.
 * Role hierarchy: CUSTOMER < AFFILIATE < STAFF < ADMIN < CENTRAL_ADMIN
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  AFFILIATE: 1,
  STAFF: 2,
  ADMIN: 3,
  CENTRAL_ADMIN: 4,
}

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Check if a user can manage resources for a specific branch.
 * Central Admins can manage any branch. Others can only manage their own.
 */
export function canManageBranch(
  user: AuthUser,
  branchId: string,
): boolean {
  if (user.role === "CENTRAL_ADMIN") return true
  return user.branchId === branchId
}

/**
 * Get Clerk user details (for avatar, name sync, etc.)
 */
export async function getClerkUser() {
  return currentUser()
}
