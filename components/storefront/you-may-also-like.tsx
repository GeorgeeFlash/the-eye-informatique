// "You May Also Like" section – server component (M11.2)
import { getRelatedProducts } from "@/actions/product.actions";
import { ProductCard } from "@/components/storefront/product-card";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SparklesIcon, ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface Props {
  productId: string;
  categoryId: string;
  categorySlug?: string;
  limit?: number;
}

export async function YouMayAlsoLike({
  productId,
  categoryId,
  categorySlug,
  limit = 4,
}: Props) {
  const [related, t] = await Promise.all([
    getRelatedProducts(productId, categoryId, limit),
    getTranslations("home"),
  ]);

  if (related.length === 0) return null;

  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 border-t border-border/60">
      {/* Section header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <SparklesIcon className="size-3.5" />
            <span>Curated For You</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            You May Also Like
          </h2>
        </div>
        {categorySlug && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="font-semibold text-primary hover:text-primary hover:bg-primary/10"
          >
            <Link href={`/products?category=${categorySlug}`}>
              {t("viewAll")} <ArrowRightIcon className="ml-1 size-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {related.map((product) => {
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
    </section>
  );
}
