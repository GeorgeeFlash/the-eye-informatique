import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/server/db"

// Auth guard: users with an approved affiliate profile
// Shell is provided by the parent dashboard/layout.tsx
export default async function AffiliateGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const profile = await db.affiliateProfile.findUnique({
    where: { userId: user.id },
    select: { status: true },
  })

  if (!profile || profile.status !== "APPROVED") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
