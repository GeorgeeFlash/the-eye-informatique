import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { SearchCommand } from "@/components/dashboard/navbar/search-command"
import { NotificationDropdown } from "@/components/dashboard/navbar/notification-dropdown"
import { UserNav } from "@/components/dashboard/navbar/user-nav"

export function DashboardNavbar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      {/* Sidebar toggle + breadcrumb separator */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Search — expands on larger screens */}
      <div className="flex flex-1 items-center gap-2">
        <SearchCommand />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationDropdown />
        <UserNav />
      </div>
    </header>
  )
}
