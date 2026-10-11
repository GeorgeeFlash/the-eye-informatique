"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ClerkLoaded, ClerkLoading, UserButton, useAuth } from "@clerk/nextjs"
import { LogInIcon, UserPlusIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { Role } from "@/lib/types"

// Separated into its own file so it can be imported with dynamic({ ssr: false }),
// which is the only reliable way to avoid server/client auth-state hydration mismatches.
export default function AuthActions({
  userRole,
  placement = "header",
  onNavigate,
}: {
  userRole?: Role
  placement?: "header" | "drawer"
  onNavigate?: () => void
}) {
  const { isSignedIn } = useAuth()
  const t = useTranslations("nav")

  const isAdmin = userRole === "ADMIN" || userRole === "CENTRAL_ADMIN"

  if (placement === "drawer") {
    return (
      <>
        <ClerkLoading>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-11 rounded-md" />
            <Skeleton className="h-11 rounded-md" />
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          {!isSignedIn ? (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link href="/sign-in" onClick={onNavigate}>
                  {t("signIn")}
                </Link>
              </Button>
              <Button asChild className="h-11">
                <Link href="/sign-up" onClick={onNavigate}>
                  {t("signUp")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="h-11 flex-1">
                <Link href="/dashboard" onClick={onNavigate}>
                  {t("dashboard")}
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" className="h-11 flex-1">
                  <Link href="/admin" onClick={onNavigate}>
                    {t("admin")}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </ClerkLoaded>
      </>
    )
  }

  return (
    <>
      <ClerkLoading>
        <div className="flex items-center gap-1 sm:gap-2">
          <Skeleton className="size-10 rounded-md sm:hidden" />
          <Skeleton className="size-10 rounded-md sm:hidden" />
          <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
          <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
          <Skeleton className="hidden h-8 w-8 rounded-full sm:block" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        {!isSignedIn ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="outline" size="icon" className="size-10 sm:hidden">
              <Link href="/sign-in" aria-label={t("signIn")}>
                <LogInIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild size="icon" className="size-10 sm:hidden">
              <Link href="/sign-up" aria-label={t("signUp")}>
                <UserPlusIcon className="size-4" />
              </Link>
            </Button>
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
