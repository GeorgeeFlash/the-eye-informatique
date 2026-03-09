import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BroadcastForm } from "./broadcast-form"

export async function generateMetadata() {
  const t = await getTranslations("adminBroadcasts")
  return { title: t("title") }
}

export default async function BroadcastsPage() {
  await requireRole(["CENTRAL_ADMIN"])
  const t = await getTranslations("adminBroadcasts")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("compose")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastForm />
        </CardContent>
      </Card>
    </div>
  )
}
