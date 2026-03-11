"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/constants";
import { PackageIcon, ChevronRightIcon } from "lucide-react";

export interface ChatProductCardProps {
  slug: string;
  name: string;
  brand?: string | null;
  category: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  inStock: boolean;
  condition: "NEW" | "REFURBISHED";
}

export function ChatProductCard({
  slug,
  name,
  brand,
  category,
  price,
  imageUrl,
  inStock,
  condition,
}: ChatProductCardProps) {
  const locale = useLocale() as Locale;

  return (
    <Link
      href={`/products/${slug}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-2.5 transition-colors hover:bg-accent"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PackageIcon className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        {brand && (
          <p className="truncate text-xs text-muted-foreground">{brand}</p>
        )}
        <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted-foreground/70">
          {category}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-sm font-semibold">
            {formatCurrency(price, locale)}
          </span>
          <Badge
            variant={inStock ? "default" : "secondary"}
            className="px-1.5 py-0 text-[10px]"
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
          {condition === "REFURBISHED" && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              Refurb
            </Badge>
          )}
        </div>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
