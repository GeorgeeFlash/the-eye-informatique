// Auth guard: ADMIN or STAFF role only (M8.1)
// Shell is provided by the parent admin/layout.tsx
export default function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Check role is ADMIN or STAFF — redirect to /admin if insufficient
  return <>{children}</>
}
