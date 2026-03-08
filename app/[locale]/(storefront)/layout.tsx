// Storefront shell — Navigation header + footer
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: <StorefrontHeader /> */}
      <main className="flex-1">{children}</main>
      {/* TODO: <StorefrontFooter /> */}
    </div>
  )
}
