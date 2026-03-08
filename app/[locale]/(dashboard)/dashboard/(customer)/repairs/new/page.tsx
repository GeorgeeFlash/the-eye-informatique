import { getTranslations } from "next-intl/server"
import { getCustomerGuarantees } from "@/actions/guarantee.actions"
import { NewRepairForm } from "./new-repair-form"

export async function generateMetadata() {
  const t = await getTranslations("repairs")
  return { title: t("newRequest") }
}

export default async function NewRepairPage() {
  const t = await getTranslations("repairs")
  const guarantees = await getCustomerGuarantees()

  const guaranteeOptions = guarantees.map((g) => ({
    id: g.id,
    label: `${g.orderItem?.variant?.product?.name ?? "Product"} — ${g.serialNumber}`,
    productId: g.orderItem?.variant?.product
      ? undefined
      : undefined,
    isActive: g.expiresAt > new Date(),
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("newRequest")}</h1>
        <p className="text-muted-foreground">{t("newRequestDescription")}</p>
      </div>

      <NewRepairForm guaranteeOptions={guaranteeOptions} />
    </div>
  )
}
