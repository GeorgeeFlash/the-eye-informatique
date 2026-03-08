import { getProducts } from "@/actions/product.actions"
import { getCategories } from "@/actions/category.actions"
import { ProductCard } from "@/components/storefront/product-card"
import { CategoryNav } from "@/components/storefront/category-nav"
import { SearchBar } from "@/components/storefront/search-bar"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface Props {
  searchParams: Promise<{
    q?: string
    category?: string
    condition?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams
  const t = await getTranslations("storefront")

  const page = Math.max(1, Number(sp.page) || 1)
  const categories = await getCategories()

  // Resolve categoryId from slug
  const activeCat = sp.category
    ? categories.find((c) => c.slug === sp.category)
    : undefined

  const { products, totalPages } = await getProducts({
    search: sp.q,
    categoryId: activeCat?.id,
    condition: sp.condition === "NEW" || sp.condition === "REFURBISHED" ? sp.condition : undefined,
    isActive: true,
    page,
    pageSize: 12,
  })

  // Build query string helper
  function qs(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { q: sp.q, category: sp.category, condition: sp.condition, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    return params.toString()
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("productsTitle")}</h1>
        <div className="w-full sm:w-72">
          <SearchBar />
        </div>
      </div>

      {/* Category Nav */}
      <CategoryNav
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        activeSlug={sp.category}
      />

      {/* Condition Tabs */}
      <div className="flex gap-2">
        {[
          { label: t("all"), value: undefined },
          { label: t("new"), value: "NEW" },
          { label: t("refurbished"), value: "REFURBISHED" },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={`/products?${qs({ condition: value, page: undefined })}`}
          >
            <Button
              variant={sp.condition === value || (!sp.condition && !value) ? "default" : "outline"}
              size="sm"
            >
              {label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t("noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const cheapestVariant = product.variants.reduce(
              (min, v) => (Number(v.price) < Number(min.price) ? v : min),
              product.variants[0],
            )
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
            const primaryImage = product.images[0]

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={Number(cheapestVariant.price)}
                imageUrl={primaryImage?.url}
                condition={cheapestVariant.condition as "NEW" | "REFURBISHED"}
                inStock={totalStock > 0}
                variantId={cheapestVariant.id}
              />
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/products?${qs({ page: String(page - 1) })}`}>
              <Button variant="outline">{t("previous")}</Button>
            </Link>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/products?${qs({ page: String(page + 1) })}`}>
              <Button variant="outline">{t("next")}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
