import { requireRole } from "@/lib/auth"

// Auth guard: ADMIN or STAFF role only (M8.1)
// Shell is provided by the parent admin/layout.tsx
export default async function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  return <>{children}</>
}
