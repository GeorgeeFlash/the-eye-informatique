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
import { ProfileForm } from "./profile-form"
import { AddressList } from "./address-list"
import { notFound } from "next/navigation"

export async function generateMetadata() {
  const t = await getTranslations("settings")
  return { title: t("title") }
}

export default async function CustomerSettingsPage() {
  const t = await getTranslations("settings")
  const locale = (await getLocale()) as "en" | "fr"
  const user = await getCurrentUser()

  if (!user) notFound()

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

      {/* Saved addresses — full CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>{t("addresses")}</CardTitle>
          <CardDescription>{t("addressesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AddressList
            addresses={addresses}
            locale={locale}
          />
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
            <span>{new Date(user.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
