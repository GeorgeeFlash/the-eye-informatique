import { requireAuth } from "@/lib/auth"

// Auth guard: authenticated users only (customer self-service)
// Shell is provided by the parent dashboard/layout.tsx
export default async function CustomerGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <>{children}</>
}
