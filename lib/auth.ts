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
 * Determine the role for a newly provisioned user.
 * The very first user in the database becomes CENTRAL_ADMIN.
 */
async function resolveRoleForNewUser(): Promise<Role> {
  const count = await db.user.count()
  return count === 0 ? "CENTRAL_ADMIN" : "CUSTOMER"
}

/**
 * Get the current platform user from the database (not just Clerk session).
 * If a Clerk session exists but no DB record is found the user is created
 * on-the-fly (first user ever becomes CENTRAL_ADMIN).
 * Returns null if there is no active Clerk session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const existing = await db.user.findUnique({
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

  if (existing) return existing as AuthUser

  // No DB record yet — provision one from the Clerk session
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  const role = await resolveRoleForNewUser()
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null

  const created = await db.user.create({
    data: { clerkId, email, name, role },
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

  return created as AuthUser
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
