"use client";

import dynamic from "next/dynamic";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb";
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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-md transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 hover:bg-primary/10 hover:text-primary transition-colors" />
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <DashboardBreadcrumb />
      </div>

      <div className="flex items-center gap-2">
        <SearchCommand />

        {isAdminRoute && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex font-semibold border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Link href="/studio">
              {t("openStudio")}
              <ExternalLinkIcon className="ml-1.5 h-3.5 w-3.5" />
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
