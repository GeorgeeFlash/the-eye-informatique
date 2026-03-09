import { getLocale, getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/server/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { ProfileForm } from "./profile-form"

export async function generateMetadata() {
  const t = await getTranslations("settings")
  return { title: t("title") }
}

export default async function CustomerSettingsPage() {
  const t = await getTranslations("settings")
  const locale = (await getLocale()) as "en" | "fr"
  const user = await getCurrentUser()

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              name: user.name ?? "",
              phone: user.phone ?? "",
              preferredLocale: user.preferredLocale as "en" | "fr",
            }}
          />
        </CardContent>
      </Card>

      {/* Saved addresses */}
      <Card>
        <CardHeader>
          <CardTitle>{t("addresses")}</CardTitle>
          <CardDescription>{t("addressesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noAddresses")}
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start justify-between rounded-md border p-3"
                >
                  <div className="space-y-1 text-sm">
                    {addr.label && (
                      <p className="font-medium">{addr.label}</p>
                    )}
                    <p>
                      {addr.street}, {addr.city}, {addr.region}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("addedOn", {
                        date: formatDate(addr.createdAt, "dd/MM/yyyy", locale),
                      })}
                    </p>
                  </div>
                  {addr.isDefault && (
                    <Badge variant="secondary">{t("default")}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("accountInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("email")}</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("memberSince")}</span>
            <span>{formatDate(user.createdAt, "dd/MM/yyyy", locale)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
