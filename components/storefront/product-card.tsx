"use client"

import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  imageUrl?: string
  condition: "NEW" | "REFURBISHED"
  inStock: boolean
  variantId: string
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  imageUrl,
  condition,
  inStock,
  variantId,
}: ProductCardProps) {
  const locale = useLocale()
  const t = useTranslations("product")
  const { addItem } = useCart()

  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${slug}`}>
        <div className="relative aspect-square bg-muted">
          {imageUrl && (
            <Image src={imageUrl} alt={name} unoptimized fill className="object-cover" />
          )}
          <Badge className="absolute left-2 top-2" variant="secondary">
            {condition === "NEW" ? t("new") : t("refurbished")}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 font-medium">{name}</h3>
        </Link>
        <p className="mt-1 text-lg font-bold">{formatCurrency(price, locale as "en" | "fr")}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          disabled={!inStock}
          onClick={() =>
            addItem({
              variantId,
              productId: id,
              productName: name,
              variantLabel: "",
              sku: "",
              price,
              quantity: 1,
              imageUrl,
            })
          }
        >
          {inStock ? t("addToCart") : t("outOfStock")}
        </Button>
      </CardFooter>
    </Card>
  )
}
