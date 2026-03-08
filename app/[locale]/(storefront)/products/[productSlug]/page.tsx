import { notFound } from "next/navigation"
import { getProductBySlug } from "@/actions/product.actions"
import { getTranslations } from "next-intl/server"
import { ProductGallery } from "@/components/storefront/product-gallery"
import { ProductDetails } from "@/components/storefront/product-details"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ productSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params
  const product = await getProductBySlug(productSlug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? "",
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { productSlug } = await params
  const t = await getTranslations("product")

  const product = await getProductBySlug(productSlug)
  if (!product) notFound()

  const images = product.images.map((img) => ({
    url: img.url,
    altText: img.alt ?? product.name,
    position: img.sortOrder,
  }))

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={images} productName={product.name} />

        {/* Details */}
        <ProductDetails product={product} />
      </div>
    </div>
  )
}
