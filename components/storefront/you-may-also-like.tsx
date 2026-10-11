// "You May Also Like" section – server component (M11.2)
import { getRelatedProducts } from "@/actions/product.actions";
import {
  RelatedProductsCarousel,
  type RelatedProduct,
} from "@/components/storefront/related-products-carousel";
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
  limit = 12,
}: Props) {
  const [related, t] = await Promise.all([
    getRelatedProducts(productId, categoryId, limit),
    getTranslations("home"),
  ]);

  if (related.length === 0) return null;

  const products: RelatedProduct[] = related.map((product) => {
    const variant = product.variants[0];
    const image = product.images[0];
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(variant?.price ?? 0),
      imageUrl: image?.url,
      condition: variant?.condition ?? "NEW",
      inStock: (variant?.stock ?? 0) > 0,
      variantId: variant?.id ?? "",
      variantStock: variant?.stock ?? 0,
    };
  });

  return (
    <RelatedProductsCarousel
      products={products}
      viewAllHref={
        categorySlug ? `/products?category=${categorySlug}` : undefined
      }
      viewAllLabel={t("viewAll")}
    />
  );
}
