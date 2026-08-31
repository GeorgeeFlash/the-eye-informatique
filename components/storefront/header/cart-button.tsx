"use client"

import { useSyncExternalStore } from "react"
import { ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart.store"
import { useUiStore } from "@/stores/ui.store"
import { useTranslations } from "next-intl"

const emptySubscribe = () => () => {}

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const toggleCartSheet = useUiStore((s) => s.toggleCartSheet)
  const t = useTranslations("nav")
  // Use useSyncExternalStore for hydration-safe rendering without setState-in-effect
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hover:bg-primary/10 hover:text-primary transition-colors"
      aria-label={t("cart")}
      onClick={toggleCartSheet}
    >
      <ShoppingCartIcon className="size-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in-50">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  )
}
