"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useDebounce } from "@/hooks/use-debounce"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const locale = useLocale()
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.trim()) {
      router.push(`/${locale}/products?q=${encodeURIComponent(debouncedQuery)}`)
    }
  }, [debouncedQuery, locale, router])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
        className="pl-9"
      />
    </div>
  )
}
