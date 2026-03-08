import { requireRole } from "@/lib/auth"

// Auth guard: CENTRAL_ADMIN role only (CON-5)
// Shell is provided by the parent admin/layout.tsx
export default async function CentralAdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["CENTRAL_ADMIN"])
  return <>{children}</>
}
