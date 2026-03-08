import { StorefrontHeader } from "@/components/storefront/header/storefront-header"
import { StorefrontFooter } from "@/components/storefront/footer/storefront-footer"
import { ChatPanel } from "@/components/ai/chat-panel"
import { getCurrentUser } from "@/lib/auth"

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader userRole={user?.role} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <ChatPanel />
    </div>
  )
}
