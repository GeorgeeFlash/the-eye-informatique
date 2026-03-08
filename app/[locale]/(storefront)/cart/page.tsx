import { redirect } from "@/i18n/navigation"

// The cart is now managed via the slide-out CartSheet (opened by the cart icon
// in the header). Any direct navigation to /cart redirects to the products page.
export default function CartPage() {
  redirect("/products")
}
