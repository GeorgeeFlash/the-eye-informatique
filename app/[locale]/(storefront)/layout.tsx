import { StorefrontHeader } from "@/components/storefront/header/storefront-header"
import { StorefrontFooter } from "@/components/storefront/footer/storefront-footer"
import { ChatPanel } from "@/components/ai/chat-panel"

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
      <ChatPanel />
    </div>
  )
}
