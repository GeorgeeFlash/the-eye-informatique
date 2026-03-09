import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SettingsIcon } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("adminSettings")
  return { title: t("title") }
}

export default async function AdminSettingsPage() {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const t = await getTranslations("adminSettings")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SettingsIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{t("comingSoon")}</CardTitle>
          <CardDescription>{t("comingSoonDescription")}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}
