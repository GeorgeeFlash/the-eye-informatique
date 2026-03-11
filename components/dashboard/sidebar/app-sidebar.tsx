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
import { APP_NAME } from "@/lib/constants";

type SidebarVariant = "admin" | "central-admin";

export function AppSidebar({
  variant = "admin",
}: {
  variant?: SidebarVariant;
}) {
  const t = useTranslations("sidebar.admin");

  const adminNav: NavItem[] = [
    {
      title: t("overview"),
      url: "/admin",
      icon: "layout-dashboard",
    },
    {
      title: t("storeManagement"),
      url: "/admin/orders",
      icon: "shopping-cart",
      items: [
        { title: t("orders"), url: "/admin/orders" },
        { title: t("products"), url: "/admin/products" },
        { title: t("categories"), url: "/admin/categories" },
        { title: t("inventory"), url: "/admin/inventory" },
        { title: t("receipts"), url: "/admin/receipts" },
        { title: t("reviews"), url: "/admin/reviews" },
      ],
    },
    {
      title: t("insights"),
      url: "/admin/analytics",
      icon: "bar-chart",
      items: [
        { title: t("analytics"), url: "/admin/analytics" },
        { title: t("blog"), url: "/admin/blog" },
        { title: t("blogAnalytics"), url: "/admin/blog/analytics" },
        { title: t("affiliates"), url: "/admin/affiliates" },
      ],
    },
  ];

  const centralAdminExtras: NavItem[] = [
    {
      title: t("system"),
      url: "/admin/users",
      icon: "server",
      items: [
        { title: t("users"), url: "/admin/users" },
        { title: t("branches"), url: "/admin/branches" },
        { title: t("broadcasts"), url: "/admin/broadcasts" },
        { title: t("knowledgeBase"), url: "/admin/knowledge-base" },
        { title: t("activityLog"), url: "/admin/activity-log" },
      ],
    },
  ];

  const bottomNav: NavItem[] = [
    {
      title: t("settings"),
      url: "/admin/settings",
      icon: "settings",
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                  TEI
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">{APP_NAME}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {variant === "central-admin"
                      ? t("centralAdmin")
                      : t("administration")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={adminNav} label={t("navigation")} />
        {variant === "central-admin" && (
          <>
            <SidebarSeparator />
            <NavMain items={centralAdminExtras} />
          </>
        )}
        <SidebarSeparator />
        <NavMain items={bottomNav} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
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
