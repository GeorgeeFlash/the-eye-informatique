import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const requestedQuantity = Math.max(0, Math.floor(item.quantity))
          const availableStock = Math.max(0, Math.floor(item.stockAvailable ?? 0))

          if (requestedQuantity <= 0 || availableStock <= 0) {
            return state
          }

          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + requestedQuantity,
              availableStock,
            )

            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: nextQuantity, stockAvailable: availableStock }
                  : i
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(requestedQuantity, availableStock),
                stockAvailable: availableStock,
              },
            ],
          }
        })
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }

        const currentItem = get().items.find((i) => i.variantId === variantId)
        if (!currentItem) return

        const nextRequestedQuantity = Math.floor(quantity)
        const availableStock = Math.max(
          0,
          Math.floor(currentItem.stockAvailable ?? Number.MAX_SAFE_INTEGER),
        )

        const nextQuantity = Math.min(nextRequestedQuantity, availableStock)

        if (nextQuantity <= 0) {
          get().removeItem(variantId)
          return
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: nextQuantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "tei-cart",
    }
  )
)
