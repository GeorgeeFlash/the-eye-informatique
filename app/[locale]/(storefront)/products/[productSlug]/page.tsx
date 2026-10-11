import { notFound } from "next/navigation";
import { getProductBySlug } from "@/actions/product.actions";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductDetails } from "@/components/storefront/product-details";
import { ProductViewTracker } from "@/components/storefront/product-view-tracker";
import { YouMayAlsoLike } from "@/components/storefront/you-may-also-like";
import type { Metadata, ResolvingMetadata } from "next";
import {
  buildProductSocialMetadata,
  localePath,
  plainShareText,
  resolveAbsoluteHttpUrl,
} from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string; productSlug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale, productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) return {};

  const previousImages = (await parent).openGraph?.images || [];
  const description = plainShareText(product.description);
  const pageUrl = resolveAbsoluteHttpUrl(
    localePath(locale, `/products/${product.slug}`),
  );

  return {
    title: product.name,
    description,
    ...buildProductSocialMetadata({
      title: product.name,
      description,
      images: product.images,
      fallbackImages: previousImages,
      pageUrl,
    }),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { productSlug } = await params;

  const product = await getProductBySlug(productSlug);
  if (!product) notFound();

  const images = product.images.map((img) => ({
    url: img.url,
    altText: img.alt ?? product.name,
    position: img.sortOrder,
  }));

  // Serialize Decimal fields to plain numbers for client components
  const serializedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    brand: product.brand,
    category: product.category,
    images: product.images.map((img) => ({ url: img.url })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      condition: v.condition,
      stock: v.stock,
      price: Number(v.price),
      weight: v.weight ? Number(v.weight) : null,
      stockByBranch: v.stockByBranch,
      options: v.options?.map((o) => ({
        axisId: o.axisValue.axisId,
        axisName: o.axisValue.axis.name,
        value: o.axisValue.value,
      })),
    })),
    reviews: product.reviews,
    reviewAggregate: product.reviewAggregate,
    featureValues:
      product.featureValues?.map((fv) => ({
        featureFieldName: fv.featureField.name,
        value: fv.value,
      })) ?? [],
  };

  return (
    <div className="flex min-w-0 flex-col overflow-x-clip pb-24 sm:pb-0">
      <div className="container mx-auto min-w-0 max-w-7xl px-4 py-5 sm:py-8">
        <ProductViewTracker productId={product.id} />
        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Gallery */}
          <ProductGallery images={images} productName={product.name} />

          {/* Details */}
          <ProductDetails product={serializedProduct} />
        </div>
      </div>

      {/* You May Also Like */}
      {product.categoryId && (
        <YouMayAlsoLike
          productId={product.id}
          categoryId={product.categoryId}
          categorySlug={product.category?.slug}
        />
      )}
    </div>
  );
}
