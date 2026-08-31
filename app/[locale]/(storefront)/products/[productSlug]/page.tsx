import { notFound } from "next/navigation";
import { getProductBySlug } from "@/actions/product.actions";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductDetails } from "@/components/storefront/product-details";
import { ProductViewTracker } from "@/components/storefront/product-view-tracker";
import { APP_URL } from "@/lib/constants";
import type { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);
  if (!product) return {};
  const previousImages = (await parent).openGraph?.images || [];
  const image = product.images[0]?.url ?? "/assets/banner.png";
  const absoluteImage = new URL(image, APP_URL).toString();
  const productImage = {
    url: absoluteImage,
    width: 1200,
    height: 630,
    alt: product.name,
  };
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? "",
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: [productImage, ...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: [productImage],
    },
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <ProductViewTracker productId={product.id} />
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Details */}
        <ProductDetails product={serializedProduct} />
      </div>
    </div>
  );
}
