import { getTranslations } from "next-intl/server"
import { GuaranteeLookupForm } from "./guarantee-lookup-form"

export async function generateMetadata() {
  const t = await getTranslations("guarantee")
  return {
    title: t("lookupTitle"),
    description: t("lookupDescription"),
  }
}

export default async function GuaranteeLookupPage() {
  const t = await getTranslations("guarantee")

  return (
    <div className="container mx-auto max-w-lg py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{t("lookupTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("lookupDescription")}</p>
      </div>

      <GuaranteeLookupForm />
    </div>
  )
}
