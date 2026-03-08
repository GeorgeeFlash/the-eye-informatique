"use client"

import Image from "next/image"
import Link from "next/link"
import { useLocale } from "next-intl"
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
  const { addItem } = useCart()

  return (
    <Card className="overflow-hidden">
      <Link href={`/${locale}/products/${slug}`}>
        <div className="relative aspect-square bg-muted">
          {imageUrl && (
            <Image src={imageUrl} alt={name} unoptimized fill className="object-cover" />
          )}
          <Badge className="absolute left-2 top-2" variant="secondary">
            {condition === "NEW" ? "Neuf" : "Reconditionné"}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/${locale}/products/${slug}`}>
          <h3 className="line-clamp-2 font-medium">{name}</h3>
        </Link>
        <p className="mt-1 text-lg font-bold">{formatCurrency(price)}</p>
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
          {inStock ? "Ajouter au panier" : "Rupture de stock"}
        </Button>
      </CardFooter>
    </Card>
  )
}
