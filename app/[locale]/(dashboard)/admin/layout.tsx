import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
import { DashboardNavbar } from "@/components/dashboard/navbar/dashboard-navbar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
