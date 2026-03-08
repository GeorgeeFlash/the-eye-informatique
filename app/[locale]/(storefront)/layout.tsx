import { StorefrontHeader } from "@/components/storefront/header/storefront-header"
import { StorefrontFooter } from "@/components/storefront/footer/storefront-footer"

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  )
}
