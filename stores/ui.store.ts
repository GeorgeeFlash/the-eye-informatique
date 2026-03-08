import { create } from "zustand"

interface UiStore {
  sidebarOpen: boolean
  cartSheetOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCartSheetOpen: (open: boolean) => void
  toggleCartSheet: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  cartSheetOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setCartSheetOpen: (open) => set({ cartSheetOpen: open }),
  toggleCartSheet: () => set((state) => ({ cartSheetOpen: !state.cartSheetOpen })),
}))
