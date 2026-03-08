"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryNavProps {
  categories: Category[]
  activeSlug?: string
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const locale = useLocale()

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      <Button
        asChild
        variant={!activeSlug ? "default" : "outline"}
        size="sm"
      >
        <Link href={`/${locale}/products`}>Tous</Link>
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          asChild
          variant={activeSlug === cat.slug ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          <Link href={`/${locale}/products?category=${cat.slug}`}>{cat.name}</Link>
        </Button>
      ))}
    </nav>
  )
}
