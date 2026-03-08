"use client"

import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCartIcon, TrashIcon, MinusIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"

export default function CartPage() {
  const t = useTranslations("cart")
  const locale = useLocale()
  const { items, removeItem, updateQuantity, totalPrice, totalItems, isEmpty } =
    useCart()

  if (isEmpty) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-24">
        <ShoppingCartIcon className="size-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t("emptyTitle")}</h1>
        <p className="text-muted-foreground">{t("emptyDescription")}</p>
        <Button asChild>
          <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {t("title")} ({totalItems})
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variantId}>
              <CardContent className="flex gap-4 p-4">
                {item.imageUrl && (
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.variantLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                      >
                        <MinusIcon className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                      >
                        <PlusIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t("orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("subtotal")} ({totalItems} {t("items")})
                </span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="text-muted-foreground">
                  {t("calculatedAtCheckout")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{t("total")}</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button asChild className="w-full" size="lg">
                <Link href={`/${locale}/checkout`}>{t("checkout")}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${locale}/products`}>{t("continueShopping")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
