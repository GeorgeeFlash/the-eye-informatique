"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  BarChart3Icon,
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageIcon,
  ScanLineIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  WrenchIcon,
  BookOpenIcon,
} from "lucide-react"
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
} from "@/components/ui/sidebar"
import { NavMain, type NavItem } from "@/components/dashboard/sidebar/nav-main"
import { APP_NAME } from "@/lib/constants"

type SidebarVariant = "admin" | "central-admin"

export function AppSidebar({ variant = "admin" }: { variant?: SidebarVariant }) {
  const t = useTranslations("sidebar.admin")

  const adminNav: NavItem[] = [
    {
      title: t("overview"),
      url: "/admin",
      icon: LayoutDashboardIcon,
    },
    {
      title: t("orders"),
      url: "/admin/orders",
      icon: ScrollTextIcon,
    },
    {
      title: t("products"),
      url: "/admin/products",
      icon: PackageIcon,
    },
    {
      title: t("repairs"),
      url: "/admin/repairs",
      icon: WrenchIcon,
    },
    {
      title: t("affiliates"),
      url: "/admin/affiliates",
      icon: GitBranchIcon,
    },
    {
      title: t("blog"),
      url: "/admin/blog",
      icon: FileTextIcon,
    },
    {
      title: t("receipts"),
      url: "/admin/receipts",
      icon: ScanLineIcon,
    },
    {
      title: t("analytics"),
      url: "/admin/analytics",
      icon: BarChart3Icon,
    },
  ]

  const centralAdminExtras: NavItem[] = [
    {
      title: t("users"),
      url: "/admin/users",
      icon: UsersIcon,
    },
    {
      title: t("branches"),
      url: "/admin/branches",
      icon: BuildingIcon,
    },
    {
      title: t("broadcasts"),
      url: "/admin/broadcasts",
      icon: MessageSquareIcon,
    },
    {
      title: t("knowledgeBase"),
      url: "/admin/knowledge-base",
      icon: BookOpenIcon,
    },
    {
      title: t("activityLog"),
      url: "/admin/activity-log",
      icon: ScrollTextIcon,
    },
  ]

  const bottomNav: NavItem[] = [
    {
      title: t("settings"),
      url: "/admin/settings",
      icon: SettingsIcon,
    },
  ]

  const mainNav = variant === "central-admin" ? [...adminNav, ...centralAdminExtras] : adminNav

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
                    {variant === "central-admin" ? t("centralAdmin") : t("administration")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNav} label={t("navigation")} />
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
  )
}
