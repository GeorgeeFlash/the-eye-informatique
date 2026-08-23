"use client";

import dynamic from "next/dynamic";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ExternalLinkIcon } from "lucide-react";

const SearchCommand = dynamic(
  () =>
    import("@/components/dashboard/navbar/search-command").then(
      (mod) => mod.SearchCommand,
    ),
  { ssr: false },
);

const NotificationDropdown = dynamic(
  () =>
    import("@/components/dashboard/navbar/notification-dropdown").then(
      (mod) => mod.NotificationDropdown,
    ),
  { ssr: false },
);

const UserNav = dynamic(
  () =>
    import("@/components/dashboard/navbar/user-nav").then((mod) => mod.UserNav),
  { ssr: false },
);

export function DashboardNavbar() {
  const pathname = usePathname();
  const t = useTranslations("dashboardNavbar");

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center gap-2 pl-1">
        <SearchCommand />
      </div>

      <div className="flex items-center gap-1">
        {isAdminRoute && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex"
          >
            <Link href="/studio">
              {t("openStudio")}
              <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <NotificationDropdown />
        <UserNav />
      </div>
    </header>
  );
}
