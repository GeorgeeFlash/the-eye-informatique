import { useCartStore } from "@/stores/cart.store"
import type { CartItem } from "@/lib/types"

export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalItems = useCartStore((s) => s.totalItems)
  const totalPrice = useCartStore((s) => s.totalPrice)

  return {
    items,
    addItem,   
    removeItem: (variantId: string) => removeItem(variantId),
    updateQuantity: (variantId: string, quantity: number) =>
      updateQuantity(variantId, quantity),
    clearCart,
    totalItems: totalItems(),
    totalPrice: totalPrice(),
    isEmpty: items.length === 0,
  }
}
