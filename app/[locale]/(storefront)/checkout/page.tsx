import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserAddresses } from "@/actions/order.actions"
import { getBranches } from "@/actions/user.actions"
import { CheckoutForm } from "@/components/storefront/checkout-form"

export async function generateMetadata() {
  const t = await getTranslations("checkout")
  return { title: t("title") }
}

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [addresses, branches] = await Promise.all([
    getUserAddresses(),
    getBranches(),
  ])

  const t = await getTranslations("checkout")

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <CheckoutForm
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          city: a.city,
          region: a.region,
        }))}
        branches={branches}
      />
    </div>
  )
}
