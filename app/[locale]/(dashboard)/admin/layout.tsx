import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
import { DashboardNavbar } from "@/components/dashboard/navbar/dashboard-navbar"
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { requireRole } from "@/lib/auth"

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])

  return (
    <SidebarProvider>
      <AppSidebar variant={user.role === "CENTRAL_ADMIN" ? "central-admin" : "admin"} />
      <SidebarInset>
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardBreadcrumb />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
