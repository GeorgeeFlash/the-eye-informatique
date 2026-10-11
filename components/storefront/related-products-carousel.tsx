"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "lucide-react";

const AUTOPLAY_MS = 4000;

export type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  condition: "NEW" | "REFURBISHED";
  inStock: boolean;
  variantId: string;
  variantStock: number;
};

export function RelatedProductsCarousel({
  products,
  viewAllHref,
  viewAllLabel,
}: {
  products: RelatedProduct[];
  viewAllHref?: string;
  viewAllLabel: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const hovered = useRef(false);
  const dragging = useRef(false);

  useEffect(() => {
    if (!api || products.length < 2) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const onPointerDown = () => {
      dragging.current = true;
    };
    const onPointerUp = () => {
      dragging.current = false;
    };

    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);

    const id = window.setInterval(() => {
      if (hovered.current || dragging.current) return;
      api.scrollNext();
    }, AUTOPLAY_MS);

    return () => {
      window.clearInterval(id);
      api.off("pointerDown", onPointerDown);
      api.off("pointerUp", onPointerUp);
    };
  }, [api, products.length]);

  return (
    <section
      className="container mx-auto min-w-0 max-w-7xl border-t border-border/60 px-4 py-8 sm:py-10"
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <SparklesIcon className="size-3.5" />
            <span>Curated For You</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            You May Also Like
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {products.length > 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => api?.scrollPrev()}
                aria-label="Previous products"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => api?.scrollNext()}
                aria-label="Next products"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </>
          )}
          {viewAllHref && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-semibold text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Link href={viewAllHref}>
                {viewAllLabel} <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: products.length > 1 }}
        className="w-full min-w-0 max-w-full"
      >
        <CarouselContent className="-ml-3">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[82%] pl-3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                imageUrl={product.imageUrl}
                condition={product.condition}
                inStock={product.inStock}
                variantId={product.variantId}
                variantStock={product.variantStock}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
