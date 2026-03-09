"use client"

import Image from "next/image"
import { useCart } from "@/hooks/use-cart"
import { useUiStore } from "@/stores/ui.store"
import { formatCurrency } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { MinusIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from "lucide-react"

export function CartSheet() {
  const t = useTranslations("cart")
  const locale = useLocale()
  const cartSheetOpen = useUiStore((s) => s.cartSheetOpen)
  const setCartSheetOpen = useUiStore((s) => s.setCartSheetOpen)
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()

  return (
    <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBagIcon className="size-5" />
            {t("title")}
            {totalItems > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <ShoppingBagIcon className="size-12 text-muted-foreground/50" />
            <div>
              <p className="font-semibold">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
            <Button asChild onClick={() => setCartSheetOpen(false)}>
              <Link href="/products">{t("continueShopping")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <ul className="divide-y px-6">
                {items.map((item) => (
                  <li key={item.variantId} className="flex gap-4 py-5">
                    {/* Thumbnail */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ShoppingBagIcon className="size-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {item.productName}
                          </p>
                          {item.variantLabel && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.variantLabel}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.variantId)}
                          aria-label={t("remove")}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {/* Qty stepper */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={
                              typeof item.stockAvailable === "number" &&
                              item.quantity >= item.stockAvailable
                            }
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="size-3" />
                          </Button>
                        </div>

                        {/* Line total */}
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity, locale as "en" | "fr")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("subtotal")} ({t("items", { count: totalItems })})
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(totalPrice, locale as "en" | "fr")}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full"
                  onClick={() => setCartSheetOpen(false)}
                >
                  <Link href="/checkout">{t("checkout")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  onClick={() => setCartSheetOpen(false)}
                >
                  <Link href="/products">{t("continueShopping")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
