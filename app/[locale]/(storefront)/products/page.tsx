import { getProducts } from "@/actions/product.actions";
import {
  getCategories,
  getFeatureFieldsByCategory,
} from "@/actions/category.actions";
import { getBranches } from "@/actions/user.actions";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryNav } from "@/components/storefront/category-nav";
import { BranchFilter } from "@/components/storefront/branch-filter";
import { SearchBar } from "@/components/storefront/search-bar";
import { FeatureFilters } from "@/components/storefront/feature-filters";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const t = await getTranslations("storefront");

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const condition = typeof sp.condition === "string" ? sp.condition : undefined;
  const branch = typeof sp.branch === "string" ? sp.branch : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [categories, branches] = await Promise.all([
    getCategories(),
    getBranches(),
  ]);

  // Resolve categoryId from slug
  const activeCat = category
    ? categories.find((c) => c.slug === category)
    : undefined;

  // Extract feature filters from ff_<fieldId>=value params
  const featureFilters: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (key.startsWith("ff_") && typeof val === "string" && val) {
      featureFilters[key.slice(3)] = val;
    }
  }

  // Load feature fields when a category is active
  const categoryFeatureFields = activeCat
    ? await getFeatureFieldsByCategory(activeCat.id)
    : [];

  const featureFieldsForFilter = categoryFeatureFields.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : null,
  }));

  const { products, totalPages } = await getProducts({
    search: q,
    categoryId: activeCat?.id,
    condition:
      condition === "NEW" || condition === "REFURBISHED"
        ? condition
        : undefined,
    featureFilters:
      Object.keys(featureFilters).length > 0 ? featureFilters : undefined,
    branchId: branch,
    isActive: true,
    page,
    pageSize: 12,
  });

  // Build query string helper — preserve ff_ params
  function qs(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, category, condition, branch, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    // Preserve feature filters unless category is being changed
    if (!overrides.category) {
      for (const [k, v] of Object.entries(featureFilters)) {
        params.set(`ff_${k}`, v);
      }
    }
    return params.toString();
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("productsTitle")}
        </h1>
        <div className="w-full sm:w-72">
          <SearchBar />
        </div>
      </div>

      {/* Category Nav */}
      <CategoryNav
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        activeSlug={category}
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
              variant={
                condition === value || (!condition && !value)
                  ? "default"
                  : "outline"
              }
              size="sm"
            >
              {label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Branch Filter */}
      <BranchFilter branches={branches} activeBranchId={branch} />

      {/* Feature Filters (when category selected) */}
      {featureFieldsForFilter.length > 0 && (
        <FeatureFilters featureFields={featureFieldsForFilter} />
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-muted-foreground">{t("noProducts")}</p>
          <Link href="/products">
            <Button variant="outline" size="sm">
              {t("clearFilters")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const cheapestVariant = product.variants.reduce(
              (min, v) => (Number(v.price) < Number(min.price) ? v : min),
              product.variants[0],
            );
            const totalStock = product.variants.reduce(
              (sum, v) => sum + v.stock,
              0,
            );
            const primaryImage = product.images[0];

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
                variantStock={cheapestVariant.stock}
              />
            );
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
  );
}
