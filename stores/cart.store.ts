import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "@/lib/types"
import {
  syncCartToServer,
  addServerCartItem,
  removeServerCartItem,
  updateServerCartItemQuantity,
  clearServerCart,
  getServerCart,
} from "@/actions/cart.actions"

interface CartStore {
  items: CartItem[]
  /** Whether the user is authenticated (set via mergeOnLogin / setAuth) */
  _authed: boolean
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
  /**
   * Call once after login. Merges local + server carts (local wins on
   * conflicts), pushes result to server, and enables background sync.
   */
  mergeOnLogin: () => Promise<void>
  /** Call on logout to disable server sync (keeps local cart as-is). */
  setLoggedOut: () => void
}

/** Fire-and-forget helper – swallows errors so UI stays fast. */
function bg(fn: () => Promise<unknown>) {
  fn().catch(() => {})
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _authed: false,

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

        // Background sync
        if (get()._authed) {
          bg(() => addServerCartItem(item.variantId, item.quantity))
        }
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))

        if (get()._authed) {
          bg(() => removeServerCartItem(variantId))
        }
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

        if (get()._authed) {
          bg(() => updateServerCartItemQuantity(variantId, nextQuantity))
        }
      },

      clearCart: () => {
        set({ items: [] })
        if (get()._authed) {
          bg(() => clearServerCart())
        }
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      mergeOnLogin: async () => {
        const local = get().items
        const server = await getServerCart()

        // Merge: for each variant, keep the higher quantity
        const merged = new Map<string, CartItem>()
        for (const item of server) merged.set(item.variantId, item)
        for (const item of local) {
          const existing = merged.get(item.variantId)
          if (existing) {
            merged.set(item.variantId, {
              ...item,
              quantity: Math.max(existing.quantity, item.quantity),
            })
          } else {
            merged.set(item.variantId, item)
          }
        }

        const mergedItems = Array.from(merged.values())
        set({ items: mergedItems, _authed: true })

        // Push merged result to server
        await syncCartToServer(
          mergedItems.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        )
      },

      setLoggedOut: () => set({ _authed: false }),
    }),
    {
      name: "tei-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
)
