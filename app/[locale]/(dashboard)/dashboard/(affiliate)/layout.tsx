// Auth guard: AFFILIATE role only
// Shell is provided by the parent dashboard/layout.tsx
export default function AffiliateGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Check role is AFFILIATE — redirect to /dashboard if insufficient
  return <>{children}</>
}
