// Shared customer + affiliate portal shell
export default function DashboardPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* TODO: <DashboardSidebar /> — role-adaptive nav (affiliate sections hidden for non-affiliates) */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
