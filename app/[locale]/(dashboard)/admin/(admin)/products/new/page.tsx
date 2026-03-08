import { requireRole } from "@/lib/auth"
import { getCategories } from "@/actions/category.actions"
import { getBranches } from "@/actions/user.actions"
import { ProductForm } from "@/components/dashboard/product-form"
import { getTranslations } from "next-intl/server"

export default async function AdminProductNewPage() {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const t = await getTranslations("productForm")

  const [categories, branches] = await Promise.all([
    getCategories(),
    user.role === "CENTRAL_ADMIN" ? getBranches() : Promise.resolve([]),
  ])

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))
  const branchOptions = Array.isArray(branches)
    ? branches.map((b) => ({ id: b.id, name: b.name }))
    : []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("createTitle")}</h1>
        <p className="text-muted-foreground">{t("createSubtitle")}</p>
      </div>

      <ProductForm
        categories={categoryOptions}
        branches={branchOptions}
        isCentralAdmin={user.role === "CENTRAL_ADMIN"}
      />
    </div>
  )
}
