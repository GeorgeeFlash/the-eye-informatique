import { requireRole } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { getBranches } from "@/actions/analytics.actions"

export default async function AdminAnalyticsPage() {
  const user = await requireRole(["ADMIN", "STAFF", "CENTRAL_ADMIN"])
  const t = await getTranslations("analytics")

  const branches =
    user.role === "CENTRAL_ADMIN" ? await getBranches() : []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <AnalyticsDashboard
        role={user.role}
        branchId={user.branchId}
        branches={branches}
      />
    </div>
  )
}
