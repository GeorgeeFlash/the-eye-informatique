import { Link } from "@/i18n/navigation";
import { PackageSearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { NavMain, type NavItem } from "@/components/dashboard/sidebar/nav-main";
import { Logo } from "@/components/shared/logo";

type PortalVariant = "customer" | "affiliate";

export function CustomerSidebar({
  variant = "customer",
}: {
  variant?: PortalVariant;
}) {
  const t = useTranslations("sidebar.customer");

  const workspaceNav: NavItem[] = [
    {
      title: t("overview"),
      url: "/dashboard",
      icon: "layout-dashboard",
      match: "exact",
    },
    {
      title: t("account"),
      icon: "briefcase",
      items: [
        { title: t("orders"), url: "/dashboard/orders", match: "prefix" },
        {
          title: t("notifications"),
          url: "/dashboard/notifications",
          match: "prefix",
        },
      ],
    },
  ];

  const storeNav: NavItem[] = [
    {
      title: t("browseProducts"),
      url: "/products",
      icon: "package-search",
      match: "prefix",
    },
  ];

  const affiliateNav: NavItem[] = [
    {
      title: t("affiliateProgram"),
      icon: "git-branch",
      items: [
        {
          title: t("earnings"),
          url: "/dashboard/earnings",
          match: "prefix",
        },
        { title: t("myLinks"), url: "/dashboard/links", match: "prefix" },
        {
          title: t("payouts"),
          url: "/dashboard/payouts",
          match: "prefix",
        },
      ],
    },
  ];

  const bottomNav: NavItem[] = [
    {
      title: t("settings"),
      url: "/dashboard/settings",
      icon: "settings",
      match: "prefix",
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="border-b border-sidebar-border/70 px-4 pt-5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-auto rounded-2xl px-3 py-2.5 hover:bg-sidebar-accent/60"
            >
              <Logo
                size="lg"
                className="gap-3 text-sm font-semibold text-sidebar-foreground"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <span className="px-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
          {variant === "affiliate" ? t("affiliateSpace") : t("mySpace")}
        </span>
      </SidebarHeader>

      <SidebarContent className="gap-5 px-0 py-4">
        <NavMain items={workspaceNav} label={t("workspace")} />
        <NavMain items={storeNav} label={t("store")} />
        {variant === "affiliate" && (
          <NavMain items={affiliateNav} label={t("affiliation")} />
        )}
        <SidebarSeparator />
        <NavMain items={bottomNav} label={t("preferences")} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="sm"
              className="h-10 rounded-2xl border border-sidebar-border/70 bg-background/70 px-3 hover:bg-sidebar-accent/60"
            >
              <Link href="/">
                <PackageSearchIcon />
                <span>{t("backToStore")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
