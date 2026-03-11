"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Locale } from "@/lib/constants";

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
    <Card className="overflow-hidden">
      <Link href={`/products/${slug}`}>
        <div className="relative aspect-square bg-muted">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={name}
              unoptimized
              fill
              className="object-cover"
            />
          )}
          <Badge className="absolute left-2 top-2" variant="secondary">
            {condition === "NEW" ? t("new") : t("refurbished")}
          </Badge>
          {!inStock && (
            <Badge className="absolute right-2 top-2" variant="destructive">
              {t("outOfStock")}
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 font-medium">{name}</h3>
        </Link>
        <p className="mt-1 text-lg font-bold">
          {formatCurrency(price, locale as Locale)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          {canAddToCart ? t("addToCart") : t("outOfStock")}
        </Button>
      </CardFooter>
    </Card>
  );
}
