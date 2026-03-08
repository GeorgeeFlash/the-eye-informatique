"use client"

import { ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart.store"

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <Button variant="ghost" size="icon" className="relative" aria-label="Panier">
      <ShoppingCartIcon className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  )
}
