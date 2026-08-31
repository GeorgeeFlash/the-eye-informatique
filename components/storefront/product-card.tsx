"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCartIcon, CheckIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  condition: "NEW" | "REFURBISHED";
  inStock: boolean;
  variantId: string;
  variantStock: number;
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
  variantStock,
}: ProductCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("product");
  const { addItem, items } = useCart();

  const quantityInCart =
    items.find((item) => item.variantId === variantId)?.quantity ?? 0;
  const canAddToCart = inStock && quantityInCart < variantStock;

  const handleAddToCart = () => {
    if (!canAddToCart) {
      toast.error(t("outOfStock"));
      return;
    }

    addItem({
      variantId,
      productId: id,
      productName: name,
      variantLabel: "",
      sku: "",
      price,
      quantity: 1,
      stockAvailable: variantStock,
      imageUrl,
    });

    toast.success(t("addedToCart", { name }));
  };

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex flex-col">
        {/* Image Stage */}
        <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden bg-muted/40 p-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              unoptimized
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <SparklesIcon className="size-10" />
            </div>
          )}

          {/* Condition Badge */}
          <div className="absolute left-3 top-3 flex flex-col gap-1 z-10">
            {condition === "REFURBISHED" ? (
              <Badge className="bg-destructive text-white hover:bg-destructive/90 border-0 shadow-xs text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                {t("refurbished")}
              </Badge>
            ) : (
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-xs text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                {t("new")}
              </Badge>
            )}
          </div>

          {/* Stock Status Badge */}
          {!inStock && (
            <Badge className="absolute right-3 top-3 bg-zinc-900/90 text-zinc-100 dark:bg-zinc-800/90 border-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10">
              {t("outOfStock")}
            </Badge>
          )}
        </Link>

        {/* Content */}
        <CardContent className="flex flex-col gap-2 p-4 pt-3">
          <Link href={`/products/${slug}`} className="group-hover:text-primary transition-colors">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground min-h-10">
              {name}
            </h3>
          </Link>
          <div className="flex items-baseline justify-between pt-1">
            <p className="text-lg font-extrabold tracking-tight text-foreground">
              {formatCurrency(price, locale as Locale)}
            </p>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="p-4 pt-0">
        <Button
          className={cn(
            "w-full gap-2 font-semibold shadow-xs transition-all duration-200",
            canAddToCart
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          {canAddToCart ? (
            <>
              <ShoppingCartIcon className="size-4" />
              <span>{t("addToCart")}</span>
            </>
          ) : (
            <span>{t("outOfStock")}</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
