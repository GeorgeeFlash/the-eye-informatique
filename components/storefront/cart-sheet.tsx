"use client";

import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useUiStore } from "@/stores/ui.store";
import { formatCurrency } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MinusIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from "lucide-react";
import { Locale } from "@/lib/constants";

export function CartSheet() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const cartSheetOpen = useUiStore((s) => s.cartSheetOpen);
  const setCartSheetOpen = useUiStore((s) => s.setCartSheetOpen);
  const { items, removeItem, updateQuantity, totalPrice, totalItems } =
    useCart();

  return (
    <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBagIcon className="size-5 text-primary" />
            <span>{t("title")}</span>
            {totalItems > 0 && (
              <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                {totalItems}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
              <ShoppingBagIcon className="size-8 text-muted-foreground/60" />
            </div>
            <div>
              <p className="font-bold text-lg">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {t("emptyDescription")}
              </p>
            </div>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" onClick={() => setCartSheetOpen(false)}>
              <Link href="/products">{t("continueShopping")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <ul className="divide-y px-6">
                {items.map((item) => (
                  <li key={item.variantId} className="flex gap-4 py-5">
                    {/* Thumbnail */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted/50 border border-border/60">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="80px"
                          className="object-contain p-1"
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
                          <p className="text-sm font-semibold leading-snug line-clamp-2">
                            {item.productName}
                          </p>
                          {item.variantLabel && (
                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                              {item.variantLabel}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
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
                        <p className="text-sm font-extrabold text-foreground">
                          {formatCurrency(
                            item.price * item.quantity,
                            locale as Locale,
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {/* Footer */}
            <div className="shrink-0 space-y-4 border-t px-6 py-5 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("subtotal")} ({t("items", { count: totalItems })})
                </span>
                <span className="text-xl font-extrabold text-foreground">
                  {formatCurrency(totalPrice, locale as Locale)}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25"
                  onClick={() => setCartSheetOpen(false)}
                >
                  <Link href="/checkout">{t("checkout")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full font-semibold border-border hover:bg-muted"
                  onClick={() => setCartSheetOpen(false)}
                >
                  <Link href="/cart">{t("viewFullCart")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
