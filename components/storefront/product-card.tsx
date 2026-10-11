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
    <Card className="group relative flex flex-col justify-between gap-0 overflow-hidden rounded-xl border border-border/80 bg-card py-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex flex-col">
        {/* Image Stage */}
        <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden bg-muted/40 p-2 sm:p-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              unoptimized
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105 sm:p-4"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <SparklesIcon className="size-8 sm:size-10" />
            </div>
          )}

          {/* Condition Badge */}
          <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1 sm:left-3 sm:top-3">
            {condition === "REFURBISHED" ? (
              <Badge className="border-0 bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs hover:bg-destructive/90 sm:px-2 sm:text-[10px]">
                {t("refurbished")}
              </Badge>
            ) : (
              <Badge className="border-0 bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs hover:bg-primary/90 sm:px-2 sm:text-[10px]">
                {t("new")}
              </Badge>
            )}
          </div>

          {/* Stock Status Badge */}
          {!inStock && (
            <Badge className="absolute right-1.5 top-1.5 z-10 border-0 bg-zinc-900/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-100 sm:right-3 sm:top-3 sm:px-2 sm:text-[10px] dark:bg-zinc-800/90">
              {t("outOfStock")}
            </Badge>
          )}
        </Link>

        {/* Content */}
        <CardContent className="flex flex-col gap-1.5 p-2.5 pt-2 sm:gap-2 sm:p-4 sm:pt-3">
          <Link href={`/products/${slug}`} className="group-hover:text-primary transition-colors">
            <h3 className="line-clamp-2 min-h-8 text-xs font-semibold leading-snug tracking-tight text-foreground sm:min-h-10 sm:text-sm">
              {name}
            </h3>
          </Link>
          <p className="text-sm font-extrabold leading-tight tracking-tight text-foreground sm:text-lg">
            {formatCurrency(price, locale as Locale)}
          </p>
        </CardContent>
      </div>

      {/* Action Footer */}
      <CardFooter className="p-2.5 pt-0 sm:p-4">
        <Button
          className={cn(
            "h-9 w-full gap-1.5 px-2 text-xs font-semibold shadow-xs transition-all duration-200 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm",
            canAddToCart
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
          disabled={!canAddToCart}
          onClick={handleAddToCart}
          aria-label={canAddToCart ? t("addToCart") : t("outOfStock")}
        >
          {canAddToCart ? (
            <>
              <ShoppingCartIcon className="size-4 shrink-0" />
              <span className="hidden truncate sm:inline">{t("addToCart")}</span>
            </>
          ) : (
            <span className="truncate">{t("outOfStock")}</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
