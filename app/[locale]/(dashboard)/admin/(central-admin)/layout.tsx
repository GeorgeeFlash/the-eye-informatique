// Auth guard: CENTRAL_ADMIN role only (CON-5)
// Shell is provided by the parent admin/layout.tsx
export default function CentralAdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Check role is CENTRAL_ADMIN — redirect to /admin if insufficient
  return <>{children}</>
}
