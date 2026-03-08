"use client"

import { useState } from "react"
import Image from "next/image"

interface ProductGalleryProps {
  images: { url: string; altText: string | null; position: number }[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [selected, setSelected] = useState(0)

  if (sorted.length === 0) {
    return <div className="aspect-square bg-muted rounded-lg" />
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={sorted[selected].url}
          alt={sorted[selected].altText ?? productName}
          fill
          className="object-cover"
          priority
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setSelected(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                i === selected ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? productName}
                fill
                priority={i === selected}
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
