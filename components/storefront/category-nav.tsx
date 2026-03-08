"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("storefront")

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      <Button
        asChild
        variant={!activeSlug ? "default" : "outline"}
        size="sm"
      >
        <Link href="/products">{t("all")}</Link>
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          asChild
          variant={activeSlug === cat.slug ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          <Link href={`/products?category=${cat.slug}`}>{cat.name}</Link>
        </Button>
      ))}
    </nav>
  )
}
