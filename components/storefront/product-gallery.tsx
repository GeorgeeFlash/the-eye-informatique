"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

interface ProductGalleryProps {
  images: { url: string; altText: string | null; position: number }[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => setSelected(api.selectedScrollSnap())

    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)

    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  if (sorted.length === 0) {
    return <div className="aspect-square bg-muted rounded-lg" />
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", containScroll: "trimSnaps" }}
        className="w-full min-w-0 max-w-full overflow-hidden"
      >
        <CarouselContent className="ml-0">
          {sorted.map((img, index) => (
            <CarouselItem key={`${img.url}-${index}`} className="pl-0">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={img.url}
                  alt={img.altText ?? productName}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-3 sm:p-6"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {sorted.length > 1 && (
          <>
            <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2" />
            <CarouselNext className="right-3 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {sorted.map((img, i) => (
            <button
              key={`${img.url}-thumb-${i}`}
              onClick={() => api?.scrollTo(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 sm:h-16 sm:w-16 ${
                i === selected ? "border-primary" : "border-transparent"
              }`}
              type="button"
              aria-label={`Show image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? productName}
                fill
                priority={i === 0}
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
