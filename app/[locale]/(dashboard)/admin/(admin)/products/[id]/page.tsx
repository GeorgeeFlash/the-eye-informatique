import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { getProduct } from "@/actions/product.actions"
import { getCategories } from "@/actions/category.actions"
import { getBranches } from "@/actions/user.actions"
import { ProductForm } from "@/components/dashboard/product-form"
import { getTranslations } from "next-intl/server"

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const t = await getTranslations("productForm")

  const [product, categories, branches] = await Promise.all([
    getProduct(id),
    getCategories(),
    user.role === "CENTRAL_ADMIN" ? getBranches() : Promise.resolve([]),
  ])

  if (!product) notFound()

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))
  const branchOptions = Array.isArray(branches)
    ? branches.map((b) => ({ id: b.id, name: b.name }))
    : []

  // Map product to form defaults
  const defaultValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    basePrice: Number(product.basePrice),
    categoryId: product.categoryId,
    brand: product.brand ?? "",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    variants: product.variants.map((v) => ({
      sku: v.sku,
      color: v.color ?? undefined,
      condition: v.condition as "NEW" | "REFURBISHED",
      stock: v.stock,
      price: Number(v.price),
      weight: v.weight ? Number(v.weight) : undefined,
    })),
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editTitle")}</h1>
        <p className="text-muted-foreground">{t("editSubtitle")}</p>
      </div>

      <ProductForm
        categories={categoryOptions}
        branches={branchOptions}
        isCentralAdmin={user.role === "CENTRAL_ADMIN"}
        defaultValues={defaultValues}
      />
    </div>
  )
}
