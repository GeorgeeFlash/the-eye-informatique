"use client";

import { useEffect, useState, useTransition, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Locale } from "@/lib/constants";
import { getProductReviews } from "@/actions/review.actions";
import { ReviewForm } from "@/components/storefront/review-form";
import { ProductShareDialog, type ShareableProduct } from "@/components/shared/product-share-dialog";

type Variant = {
  id: string;
  sku: string;
  color: string | null;
  condition: string;
  stock: number;
  price: number;
  weight: number | null;
  stockByBranch: {
    stock: number;
    branch: { id: string; name: string; city: string };
  }[];
  options?: {
    axisId: string;
    axisName: string;
    value: string;
  }[];
};

type ProductData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  brand: string | null;
  category: { id: string; name: string } | null;
  images: { url: string }[];
  variants: Variant[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    user: { name: string | null };
  }[];
  reviewAggregate: { avg: number | null; count: number };
  featureValues?: {
    featureFieldName: string;
    value: string;
  }[];
};

interface ProductDetailsProps {
  product: ProductData;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const LOW_STOCK_THRESHOLD = 3;

  const t = useTranslations("product");
  const locale = useLocale() as Locale;
  const { addItem, items } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);

  const hasAxisOptions = product.variants.some(
    (v) => v.options && v.options.length > 0,
  )

  const axisMap = useMemo(() => {
    if (!hasAxisOptions) return new Map()
    const map = new Map<string, { name: string; values: string[] }>()
    for (const v of product.variants) {
      for (const opt of v.options ?? []) {
        if (!map.has(opt.axisId)) {
          map.set(opt.axisId, { name: opt.axisName, values: [] })
        }
        const entry = map.get(opt.axisId)!
        if (!entry.values.includes(opt.value)) {
          entry.values.push(opt.value)
        }
      }
    }
    return map
  }, [product.variants, hasAxisOptions])

  const [selectedAxisValues, setSelectedAxisValues] = useState<Record<string, string>>(() => {
    if (!hasAxisOptions) return {}
    const initial: Record<string, string> = {}
    for (const [axisId, data] of axisMap) {
      initial[axisId] = data.values[0]
    }
    return initial
  })

  const axisSelectedVariant = useMemo(() => {
    if (!hasAxisOptions) return null
    return product.variants.find((v) => {
      if (!v.options || v.options.length === 0) return false
      return v.options.every(
        (opt) => selectedAxisValues[opt.axisId] === opt.value,
      )
    }) ?? null
  }, [product.variants, selectedAxisValues, hasAxisOptions])

  const activeVariant = hasAxisOptions ? axisSelectedVariant : product.variants.find((v) => v.id === selectedVariantId) ?? null

  const price = activeVariant ? activeVariant.price : product.basePrice;
  const stockCount = activeVariant?.stock ?? 0;
  const quantityInCart = activeVariant
    ? (items.find((i) => i.variantId === activeVariant.id)?.quantity ?? 0)
    : 0;
  const availableToAdd = Math.max(0, stockCount - quantityInCart);
  const inStock = stockCount > 0;
  const isLowStock = inStock && stockCount <= LOW_STOCK_THRESHOLD;
  const maxQuantity = Math.max(1, availableToAdd);
  const canAddToCart = Boolean(activeVariant && availableToAdd > 0);

  useEffect(() => {
    // Keep quantity valid whenever selected variant changes.
    if (!activeVariant || availableToAdd <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantity(1);
      return;
    }

    setQuantity((current) => Math.min(Math.max(current, 1), availableToAdd));
  }, [availableToAdd, activeVariant]);

  const avgRating = product.reviewAggregate.avg;
  const totalReviewCount = product.reviewAggregate.count;

  // Review pagination & sorting state
  const [reviewPage, setReviewPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [paginatedReviews, setPaginatedReviews] = useState(product.reviews);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [isLoadingReviews, startReviewTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const purchaseActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startReviewTransition(async () => {
      const result = await getProductReviews(product.id, {
        page: reviewPage,
        pageSize: 10,
        sortBy,
      });
      setPaginatedReviews(result.reviews);
      setReviewTotalPages(result.totalPages);
    });
  }, [product.id, reviewPage, sortBy]);

  useEffect(() => {
    const el = purchaseActionsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    if (!activeVariant || availableToAdd <= 0) {
      toast.error(t("outOfStock"));
      return;
    }

    const quantityToAdd = Math.min(quantity, availableToAdd);

    const topBranch = activeVariant.stockByBranch
      .filter((s) => s.stock > 0)
      .sort((a, b) => b.stock - a.stock)[0];

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: [
        activeVariant.condition === "NEW" ? t("new") : t("refurbished"),
        activeVariant.color,
      ]
        .filter(Boolean)
        .join(" — "),
      sku: activeVariant.sku,
      price,
      quantity: quantityToAdd,
      stockAvailable: activeVariant.stock,
      imageUrl: product.images[0]?.url,
      branchId: topBranch?.branch.id,
      branchCity: topBranch?.branch.city,
    });

    toast.success(t("addedToCart", { name: product.name }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Category */}
      {product.category && (
        <Badge variant="secondary">{product.category.name}</Badge>
      )}

      {/* Name & Brand */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
        {product.brand && (
          <p className="mt-1 text-muted-foreground">
            {t("brand")}: {product.brand}
          </p>
        )}
      </div>

      {/* Rating */}
      {avgRating !== null && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="font-medium">{avgRating.toFixed(1)} / 5</span>
          <span className="text-muted-foreground">
            ({totalReviewCount}{" "}
            {totalReviewCount === 1 ? t("reviewSingular") : t("reviews")})
          </span>
        </div>
      )}

      {/* Price */}
      <p className="text-2xl font-bold sm:text-3xl">
        {formatCurrency(price, locale as Locale)}
      </p>

      <Separator />

      {/* Variant Selector */}
      {product.variants.length > 1 && hasAxisOptions && (
        <div className="space-y-3">
          {Array.from(axisMap.entries()).map(([axisId, data]) => (
            <div key={axisId} className="space-y-1">
              <label className="text-sm font-medium">{data.name}</label>
              <Select
                value={selectedAxisValues[axisId] ?? ""}
                onValueChange={(v) =>
                  setSelectedAxisValues((prev) => ({ ...prev, [axisId]: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.values.map((val: string) => (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {axisSelectedVariant && (
            <p className="text-sm text-muted-foreground">
              {formatCurrency(axisSelectedVariant.price, locale as Locale)}
              {axisSelectedVariant.stock === 0 ? ` — ${t("outOfStock")}` : ""}
            </p>
          )}
        </div>
      )}

      {product.variants.length > 1 && !hasAxisOptions && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("condition")}</label>
          <Select
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.condition === "NEW" ? t("new") : t("refurbished")}
                  {v.color ? ` — ${v.color}` : ""}
                  {" · "}
                  {formatCurrency(v.price, locale as Locale)}
                  {v.stock === 0 ? ` (${t("outOfStock")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Single variant info */}
      {product.variants.length === 1 && activeVariant && (
        <div className="flex gap-2">
          <Badge
            variant={activeVariant.condition === "REFURBISHED" ? "destructive" : "default"}
            className="font-bold uppercase tracking-wider text-[10px]"
          >
            {activeVariant.condition === "NEW" ? t("new") : t("refurbished")}
          </Badge>
          {activeVariant.color && (
            <Badge variant="outline">{activeVariant.color}</Badge>
          )}
        </div>
      )}

      {/* Stock status */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {inStock ? (
          <>
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("inStock")}</span>
            <span className="text-muted-foreground">
              {t("stockCount", { count: stockCount })}
            </span>
            {isLowStock && <Badge variant="destructive">{t("lowStock")}</Badge>}
          </>
        ) : (
          <>
            <span className="text-destructive font-medium">
              {t("outOfStock")}
            </span>
            <span className="text-muted-foreground">
              {t("stockCount", { count: stockCount })}
            </span>
          </>
        )}
      </div>

      {/* Add to Cart */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("quantity")}</label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={!inStock || quantity <= 1}
            aria-label="Decrease quantity"
          >
            <MinusIcon className="size-4" />
          </Button>

          <span className="w-10 text-center text-sm tabular-nums font-semibold">
            {quantity}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() =>
              setQuantity((current) => Math.min(maxQuantity, current + 1))
            }
            disabled={!canAddToCart || quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div ref={purchaseActionsRef} className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          className="px-3 font-semibold sm:flex-1"
          onClick={() => setShareOpen(true)}
          aria-label={t("share")}
        >
          <Share2Icon className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">{t("share")}</span>
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-primary font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99]"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
        >
          <ShoppingCartIcon className="mr-2 h-5 w-5 shrink-0" />
          <span className="truncate">{inStock ? t("addToCart") : t("outOfStock")}</span>
        </Button>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md transition-transform duration-200 sm:hidden ${
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showStickyBar}
        inert={!showStickyBar}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 pr-20 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <p className="min-w-0 shrink text-base font-extrabold leading-tight tracking-tight">
            {formatCurrency(price, locale as Locale)}
          </p>
          <Button
            className="h-11 min-w-0 flex-1 bg-primary font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
          >
            <ShoppingCartIcon className="mr-2 size-4 shrink-0" />
            <span className="truncate">{inStock ? t("addToCart") : t("outOfStock")}</span>
          </Button>
        </div>
      </div>

      <ProductShareDialog
        product={
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description ?? undefined,
            basePrice: product.basePrice,
            brand: product.brand ?? undefined,
            categoryName: product.category?.name ?? undefined,
            imageUrl: product.images[0]?.url ?? undefined,
            condition: activeVariant?.condition ?? product.variants[0]?.condition ?? "NEW",
          } as ShareableProduct
        }
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t("descriptionHeading")}</h2>
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(product.description),
            }}
          />
        </div>
      )}

      {/* Specifications / Feature Values */}
      {product.featureValues && product.featureValues.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t("specifications")}</h2>
          <div className="divide-y overflow-hidden rounded-lg border text-sm">
            {product.featureValues.map((fv, i) => (
              <div
                key={fv.featureFieldName}
                className={`flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${
                  i % 2 === 0 ? "bg-muted/50" : ""
                }`}
              >
                <span className="font-medium text-muted-foreground">
                  {fv.featureFieldName}
                </span>
                <span className="sm:text-right">{fv.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Reviews */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">{t("reviews")}</h2>
          {totalReviewCount > 0 && (
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v as typeof sortBy);
                setReviewPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
                <SelectItem value="highest">{t("sortHighest")}</SelectItem>
                <SelectItem value="lowest">{t("sortLowest")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Review form */}
        <ReviewForm productId={product.id} />

        {paginatedReviews.length > 0 ? (
          <div className="space-y-3">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="space-y-1 rounded-lg border p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium">
                    {review.user.name ?? t("anonymous")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                    {"createdAt" in review && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          review.createdAt as string,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}

            {/* Pagination */}
            {reviewTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={reviewPage <= 1 || isLoadingReviews}
                  onClick={() => setReviewPage((p) => p - 1)}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {reviewPage} / {reviewTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={reviewPage >= reviewTotalPages || isLoadingReviews}
                  onClick={() => setReviewPage((p) => p + 1)}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
        )}
      </div>
    </div>
  );
}
