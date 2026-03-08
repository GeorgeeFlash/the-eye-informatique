"use client"

// Dashboard sidebar — used by admin, affiliate, and customer dashboards
// TODO: Replace with role-aware navigation items
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <nav className="p-4">
        {/* TODO: Navigation items based on user role */}
      </nav>
    </aside>
  )
}
