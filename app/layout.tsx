// Root layout — intentionally minimal.
// The <html> and <body> tags are rendered by app/[locale]/layout.tsx
// so that next-intl can set the correct lang attribute per locale.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
