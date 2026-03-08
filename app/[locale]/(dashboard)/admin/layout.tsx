// Shared admin portal shell — all admin roles (Branch Admin + Central Admin) (M8.1)
export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* TODO: <AdminSidebar /> — role-adaptive nav items */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TODO: <AdminHeader /> */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
