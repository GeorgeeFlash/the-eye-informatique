// Homepage (M2.1, M11.2)
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { getProducts } from "@/actions/product.actions"
import { getCategories } from "@/actions/category.actions"
import { ProductCard } from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, SparklesIcon, WrenchIcon, ShieldCheckIcon, TruckIcon } from "lucide-react"

export default async function HomePage() {
  const t = await getTranslations("home")
  const [{ products: featured }, categories] = await Promise.all([
    getProducts({ isFeatured: true, isActive: true, pageSize: 8 }),
    getCategories(),
  ])

  return (
    <>
      {/* Hero section */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/products">{t("shopNow")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/products?condition=REFURBISHED">
                {t("refurbished")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value propositions */}
      <section className="border-b py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: TruckIcon, label: t("valueFastDelivery") },
              { icon: ShieldCheckIcon, label: t("valueWarranty") },
              { icon: WrenchIcon, label: t("valueRepairService") },
              { icon: SparklesIcon, label: t("valueQuality") },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground"
              >
                <Icon className="size-6 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("categories")}</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/products">
                  {t("viewAll")} <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <span className="font-medium group-hover:text-primary">
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("productCount", {
                      count: (cat as unknown as { _count: { products: number } })._count.products,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t("featuredProducts")}</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/products">
                  {t("viewAll")} <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => {
                const variant = product.variants[0]
                const image = product.images[0]
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={Number(variant?.price ?? 0)}
                    imageUrl={image?.url}
                    condition={variant?.condition ?? "NEW"}
                    inStock={(variant?.stock ?? 0) > 0}
                    variantId={variant?.id ?? ""}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
