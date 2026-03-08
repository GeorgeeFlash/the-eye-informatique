"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShoppingCartIcon, CheckCircleIcon } from "lucide-react"

type Variant = {
  id: string
  sku: string
  color: string | null
  condition: string
  stock: number
  price: unknown // Decimal
  weight: unknown | null
  stockByBranch: {
    stock: number
    branch: { id: string; name: string }
  }[]
}

type ProductData = {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: unknown // Decimal
  brand: string | null
  category: { id: string; name: string } | null
  variants: Variant[]
  reviews: {
    id: string
    rating: number
    comment: string | null
    user: { name: string | null }
  }[]
}

interface ProductDetailsProps {
  product: ProductData
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const t = useTranslations("product")
  const { addItem } = useCart()

  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  )

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const price = selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice)
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  return (
    <div className="space-y-6">
      {/* Category */}
      {product.category && (
        <Badge variant="secondary">{product.category.name}</Badge>
      )}

      {/* Name & Brand */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        {product.brand && (
          <p className="mt-1 text-muted-foreground">
            {t("brand")}: {product.brand}
          </p>
        )}
      </div>

      {/* Rating */}
      {avgRating !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{avgRating.toFixed(1)} / 5</span>
          <span className="text-muted-foreground">
            ({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      {/* Price */}
      <p className="text-3xl font-bold">{formatCurrency(price)}</p>

      <Separator />

      {/* Variant Selector */}
      {product.variants.length > 1 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("condition")}</label>
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.condition === "NEW" ? t("new") : t("refurbished")}
                  {v.color ? ` — ${v.color}` : ""}
                  {" · "}
                  {formatCurrency(Number(v.price))}
                  {v.stock === 0 ? ` (${t("outOfStock")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Single variant info */}
      {product.variants.length === 1 && selectedVariant && (
        <div className="flex gap-2">
          <Badge variant="outline">
            {selectedVariant.condition === "NEW" ? t("new") : t("refurbished")}
          </Badge>
          {selectedVariant.color && (
            <Badge variant="outline">{selectedVariant.color}</Badge>
          )}
        </div>
      )}

      {/* Stock status */}
      <div className="flex items-center gap-2 text-sm">
        {inStock ? (
          <>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">
              {t("inStock")}
            </span>
          </>
        ) : (
          <span className="text-destructive font-medium">{t("outOfStock")}</span>
        )}
      </div>

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full"
        disabled={!inStock || !selectedVariant}
        onClick={() => {
          if (!selectedVariant) return
          addItem({
            variantId: selectedVariant.id,
            productId: product.id,
            productName: product.name,
            variantLabel: [
              selectedVariant.condition === "NEW" ? t("new") : t("refurbished"),
              selectedVariant.color,
            ]
              .filter(Boolean)
              .join(" — "),
            sku: selectedVariant.sku,
            price,
            quantity: 1,
            imageUrl: undefined,
          })
        }}
      >
        <ShoppingCartIcon className="mr-2 h-5 w-5" />
        {inStock ? t("addToCart") : t("outOfStock")}
      </Button>

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t("descriptionHeading")}</h2>
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      <Separator />

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("reviews")}</h2>
          {product.reviews.map((review) => (
            <div key={review.id} className="space-y-1 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {review.user.name ?? t("anonymous")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
