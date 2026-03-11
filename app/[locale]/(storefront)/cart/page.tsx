"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
  MapPinIcon,
} from "lucide-react";
import { Locale } from "@/lib/constants";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { items, removeItem, updateQuantity, totalPrice, totalItems, isEmpty } =
    useCart();

  if (isEmpty) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center gap-6 py-24 text-center">
        <ShoppingBagIcon className="size-16 text-muted-foreground/40" />
        <div>
          <h1 className="text-2xl font-bold">{t("emptyTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("emptyDescription")}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">
        {t("title")} ({t("items", { count: totalItems })})
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Item list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variantId}>
              <CardContent className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ShoppingBagIcon className="size-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium leading-snug line-clamp-2">
                        {item.productName}
                      </p>
                      {item.variantLabel && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.variantLabel}
                        </p>
                      )}
                      {item.branchCity && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPinIcon className="size-3" />
                          {t("shipsFrom", { city: item.branchCity })}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">
                      {formatCurrency(item.price, locale)} × {item.quantity}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {/* Qty stepper */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        aria-label={t("decrease")}
                      >
                        <MinusIcon className="size-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={
                          typeof item.stockAvailable === "number" &&
                          item.quantity >= item.stockAvailable
                        }
                        aria-label={t("increase")}
                      >
                        <PlusIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={t("remove")}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>

                    {/* Line total */}
                    <p className="text-base font-semibold">
                      {formatCurrency(item.price * item.quantity, locale)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t("orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatCurrency(totalPrice, locale)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>{t("total")}</span>
                <span className="text-lg">
                  {formatCurrency(totalPrice, locale)}
                </span>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">{t("checkout")}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/products">{t("continueShopping")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
