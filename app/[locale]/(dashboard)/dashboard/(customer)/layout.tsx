// Auth guard: authenticated users only (customer self-service)
// Shell is provided by the parent dashboard/layout.tsx
export default function CustomerGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Check authenticated — redirect to /sign-in if not
  return <>{children}</>
}
