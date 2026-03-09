import { getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/server/db"
import { getBranches } from "@/actions/user.actions"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AffiliateApplyForm } from "./affiliate-apply-form"

export async function generateMetadata() {
  const t = await getTranslations("affiliateApply")
  return { title: t("title") }
}

export default async function AffiliateApplyPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const t = await getTranslations("affiliateApply")

  const [existingProfile, branches] = await Promise.all([
    db.affiliateProfile.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        rejectionReason: true,
        rejectedAt: true,
        suspensionReason: true,
      },
    }),
    getBranches(),
  ])

  // Already approved — redirect to affiliate dashboard
  if (existingProfile?.status === "APPROVED") {
    redirect("/dashboard/earnings")
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const canReapply =
    !existingProfile?.rejectedAt ||
    existingProfile.rejectedAt.getTime() + thirtyDaysMs <= new Date().getTime()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Status notices */}
      {existingProfile?.status === "PENDING" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t("pending")}</Badge>
              <CardTitle className="text-base">{t("pendingTitle")}</CardTitle>
            </div>
            <CardDescription>{t("pendingDescription")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {existingProfile?.status === "SUSPENDED" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{t("suspended")}</Badge>
              <CardTitle className="text-base">{t("suspendedTitle")}</CardTitle>
            </div>
            <CardDescription>{t("suspendedDescription")}</CardDescription>
            {existingProfile.suspensionReason && (
              <p className="mt-2 text-sm">{t("reason")}: {existingProfile.suspensionReason}</p>
            )}
          </CardHeader>
        </Card>
      )}

      {existingProfile?.status === "REJECTED" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{t("rejected")}</Badge>
              <CardTitle className="text-base">{t("rejectedTitle")}</CardTitle>
            </div>
            <CardDescription>{t("rejectedDescription")}</CardDescription>
            {existingProfile.rejectionReason && (
              <p className="mt-2 text-sm">{t("reason")}: {existingProfile.rejectionReason}</p>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Application form — show only if no pending/suspended profile */}
      {(!existingProfile || existingProfile.status === "REJECTED") && (
        <AffiliateApplyForm
          branches={branches}
          canReapply={canReapply}
        />
      )}
    </div>
  )
}
