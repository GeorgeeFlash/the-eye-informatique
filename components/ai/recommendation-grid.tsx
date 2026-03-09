"use client"

import { ProductCard } from "@/components/storefront/product-card"

interface RecommendedProduct {
  id: string
  name: string
  slug: string
  price: number
  imageUrl?: string
  condition: "NEW" | "REFURBISHED"
  inStock: boolean
  variantId: string
  variantStock: number
}

interface RecommendationGridProps {
  products: RecommendedProduct[]
  title?: string
}

export function RecommendationGrid({
  products,
  title = "Produits recommandés",
}: RecommendationGridProps) {
  if (products.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  )
}
