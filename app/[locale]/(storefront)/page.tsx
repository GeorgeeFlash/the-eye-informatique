// Homepage (M2.1, M11.2)
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getProducts } from "@/actions/product.actions";
import { getCategories } from "@/actions/category.actions";
import { sanityFetch } from "@/sanity/lib/live";
import { urlFor } from "@/sanity/lib/image";
import { HERO_BANNER_QUERY } from "@/sanity/lib/queries";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  SparklesIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
  TruckIcon,
  FlameIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations("home");
  const [{ products: featured }, categories, { data: heroBanner }] =
    await Promise.all([
      getProducts({ isFeatured: true, isActive: true, pageSize: 8 }),
      getCategories(),
      sanityFetch({ query: HERO_BANNER_QUERY }),
    ]);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-16">
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-primary/5 via-background to-background py-16 sm:py-24 md:py-28">
        {/* Ambient Glows */}
        <div className="hero-glow -top-32 -left-32 size-96 bg-primary/20" />
        <div className="hero-glow -bottom-32 -right-32 size-96 bg-destructive/15" />

        {heroBanner?.image && (
          <Image
            src={urlFor(heroBanner.image).width(1920).height(800).url()}
            alt=""
            fill
            priority
            className="object-cover opacity-15 dark:opacity-10"
          />
        )}

        <div className="container relative mx-auto px-4 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md mb-6">
            <span className="flex size-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-foreground">{t("valueQuality")}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-bold">The Eye Informatique</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:leading-[1.15]">
            {heroBanner?.title ?? t("heroTitle")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            {heroBanner?.subtitle ?? t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              <Link href={heroBanner?.ctaPrimary?.href ?? "/products"}>
                <span>{heroBanner?.ctaPrimary?.label ?? t("shopNow")}</span>
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 font-semibold border-border hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive transition-all"
            >
              <Link
                href={
                  heroBanner?.ctaSecondary?.href ??
                  "/products?condition=REFURBISHED"
                }
              >
                <FlameIcon className="mr-2 size-4 text-destructive" />
                <span>{heroBanner?.ctaSecondary?.label ?? t("refurbished")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value propositions */}
      <section className="container mx-auto px-4 -mt-6 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            {
              icon: TruckIcon,
              label: t("valueFastDelivery"),
              color: "text-primary bg-primary/10 border-primary/20",
            },
            {
              icon: ShieldCheckIcon,
              label: t("valueWarranty"),
              color: "text-destructive bg-destructive/10 border-destructive/20",
            },
            {
              icon: HeadphonesIcon,
              label: t("valueCustomerSupport"),
              color: "text-primary bg-primary/10 border-primary/20",
            },
            {
              icon: SparklesIcon,
              label: t("valueQuality"),
              color: "text-destructive bg-destructive/10 border-destructive/20",
            },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border/80 bg-card p-4 sm:p-5 text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border"
            >
              <div className={`flex size-11 items-center justify-center rounded-xl border ${color}`}>
                <Icon className="size-5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6 pb-2 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Explore Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                {t("categories")}
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/10">
              <Link href="/products">
                {t("viewAll")} <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => {
              const img = cat.products[0]?.images[0];
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative flex flex-col items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 p-2 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10">
                    {img ? (
                      <div className="relative size-10">
                        <Image
                          src={img.url}
                          alt={img.alt ?? cat.name}
                          fill
                          className="rounded object-contain"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <SparklesIcon className="size-6 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {t("productCount", {
                        count: cat._count.products,
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-6 sm:p-8">
            <div className="flex items-end justify-between mb-6 pb-2 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-destructive">
                  <FlameIcon className="size-3.5" />
                  <span>Handpicked Deals</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                  {t("featuredProducts")}
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm" className="font-semibold text-primary hover:text-primary hover:bg-primary/10">
                <Link href="/products">
                  {t("viewAll")} <ArrowRightIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => {
                const variant = product.variants[0];
                const image = product.images[0];
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
                    variantStock={variant?.stock ?? 0}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
