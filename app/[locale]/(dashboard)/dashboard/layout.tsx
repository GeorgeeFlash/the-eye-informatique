import { CustomerSidebar } from "@/components/dashboard/sidebar/customer-sidebar"
import { DashboardNavbar } from "@/components/dashboard/navbar/dashboard-navbar"
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/server/db"

export default async function DashboardPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Check if user has an approved affiliate profile to show affiliate nav
  let isAffiliate = false
  if (user) {
    const profile = await db.affiliateProfile.findUnique({
      where: { userId: user.id },
      select: { status: true },
    })
    isAffiliate = profile?.status === "APPROVED"
  }

  return (
    <SidebarProvider>
      <CustomerSidebar variant={isAffiliate ? "affiliate" : "customer"} />
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
