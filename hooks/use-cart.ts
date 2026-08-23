import { useCartStore } from "@/stores/cart.store"

export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return {
    items,
    addItem,
    removeItem: (variantId: string) => removeItem(variantId),
    updateQuantity: (variantId: string, quantity: number) =>
      updateQuantity(variantId, quantity),
    clearCart,
    totalItems,
    totalPrice,
    isEmpty: items.length === 0,
  }
}
