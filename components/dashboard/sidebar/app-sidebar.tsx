import { Link } from "@/i18n/navigation";
import { BriefcaseIcon } from "lucide-react";
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

type SidebarVariant = "admin" | "central-admin";

export function AppSidebar({
  variant = "admin",
}: {
  variant?: SidebarVariant;
}) {
  const t = useTranslations("sidebar.admin");

  const workspaceNav: NavItem[] = [
    {
      title: t("overview"),
      url: "/admin",
      icon: "layout-dashboard",
      match: "exact",
    },
  ];

  const operationsNav: NavItem[] = [
    {
      title: t("commerce"),
      icon: "shopping-cart",
      items: [
        { title: t("orders"), url: "/admin/orders", match: "prefix" },
        { title: t("products"), url: "/admin/products", match: "prefix" },
        {
          title: t("categories"),
          url: "/admin/categories",
          match: "prefix",
        },
        { title: t("variants"), url: "/admin/variants", match: "prefix" },
        {
          title: t("inventory"),
          url: "/admin/inventory",
          match: "prefix",
        },
        { title: t("receipts"), url: "/admin/receipts", match: "prefix" },
        { title: t("reviews"), url: "/admin/reviews", match: "prefix" },
      ],
    },
    {
      title: t("marketing"),
      icon: "megaphone",
      items: [
        {
          title: t("broadcasts"),
          url: "/admin/broadcasts",
          match: "prefix",
        },
        {
          title: t("affiliates"),
          url: "/admin/affiliates",
          match: "prefix",
        },
      ],
    },
      {
        title: t("content"),
        icon: "newspaper",
        items: [
          { title: t("blog"), url: "/admin/blog", match: "prefix" },
          {
            title: t("blogAnalytics"),
            url: "/admin/blog/analytics",
            match: "prefix",
          },
          { title: t("media"), url: "/admin/media", match: "prefix" },
        ],
      },
    {
      title: t("insights"),
      icon: "bar-chart",
      items: [
        {
          title: t("analytics"),
          url: "/admin/analytics",
          match: "prefix",
        },
        {
          title: t("activityLog"),
          url: "/admin/activity-log",
          match: "prefix",
        },
      ],
    },
  ];

  const centralAdminExtras: NavItem[] = [
    {
      title: t("platform"),
      icon: "server",
      items: [
        { title: t("users"), url: "/admin/users", match: "prefix" },
        {
          title: t("branches"),
          url: "/admin/branches",
          match: "prefix",
        },
        {
          title: t("knowledgeBase"),
          url: "/admin/knowledge-base",
          match: "prefix",
        },
      ],
    },
  ];

  const bottomNav: NavItem[] = [
    {
      title: t("settings"),
      url: "/admin/settings",
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
          {variant === "central-admin"
            ? t("centralAdmin")
            : t("administration")}
        </span>
      </SidebarHeader>

      <SidebarContent className="gap-5 px-0 py-4">
        <NavMain items={workspaceNav} label={t("workspace")} />
        <NavMain items={operationsNav} label={t("management")} />
        {variant === "central-admin" && (
          <NavMain items={centralAdminExtras} label={t("platformSection")} />
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
                <BriefcaseIcon />
                <span>{t("viewStore")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
