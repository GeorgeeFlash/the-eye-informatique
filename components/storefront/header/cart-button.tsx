"use client"

import { useEffect, useState } from "react"
import { ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart.store"
import { useUiStore } from "@/stores/ui.store"
import { useTranslations } from "next-intl"

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const toggleCartSheet = useUiStore((s) => s.toggleCartSheet)
  const t = useTranslations("nav")
  // Zustand `persist` rehydrates from localStorage on the client, so `count` can
  // differ from the server (always 0). Defer the badge until after hydration.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={t("cart")}
      onClick={toggleCartSheet}
    >
      <ShoppingCartIcon className="size-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  )
}
