"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ClerkLoaded, ClerkLoading, UserButton, useAuth } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { Role } from "@/lib/types"

// Separated into its own file so it can be imported with dynamic({ ssr: false }),
// which is the only reliable way to avoid server/client auth-state hydration mismatches.
export default function AuthActions({ userRole }: { userRole?: Role }) {
  const { isSignedIn } = useAuth()
  const t = useTranslations("nav")

  const isAdmin = userRole === "ADMIN" || userRole === "CENTRAL_ADMIN"

  return (
    <>
      <ClerkLoading>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
          <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        {!isSignedIn ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-up">{t("signUp")}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">{t("dashboard")}</Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/admin">{t("admin")}</Link>
              </Button>
            )}
            <UserButton />
          </div>
        )}
      </ClerkLoaded>
    </>
  )
}
