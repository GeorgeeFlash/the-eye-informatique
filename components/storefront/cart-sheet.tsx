"use client"

import { useCart } from "@/hooks/use-cart"
import { useUiStore } from "@/stores/ui.store"
import { formatCurrency } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useLocale } from "next-intl"

export function CartSheet() {
  const locale = useLocale()
  const cartSheetOpen = useUiStore((s) => s.cartSheetOpen)
  const setCartSheetOpen = useUiStore((s) => s.setCartSheetOpen)
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()

  return (
    <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Panier ({totalItems})</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Votre panier est vide
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto text-destructive"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <>
            <Separator />
            <div className="py-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <Button asChild className="w-full" onClick={() => setCartSheetOpen(false)}>
                <Link href={`/${locale}/checkout`}>Passer la commande</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
