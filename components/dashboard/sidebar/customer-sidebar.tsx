"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  BellIcon,
  BotIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  PackageSearchIcon,
  ScrollTextIcon,
  SettingsIcon,
  WrenchIcon,
  ShieldCheckIcon,
  DollarSignIcon,
  LinkIcon,
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

type PortalVariant = "customer" | "affiliate"

export function CustomerSidebar({ variant = "customer" }: { variant?: PortalVariant }) {
  const t = useTranslations("sidebar.customer")

  const customerNav: NavItem[] = [
    {
      title: t("overview"),
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: t("orders"),
      url: "/dashboard/orders",
      icon: ScrollTextIcon,
    },
    {
      title: t("guarantee"),
      url: "/dashboard/guarantee",
      icon: ShieldCheckIcon,
    },
    {
      title: t("repairs"),
      url: "/dashboard/repairs",
      icon: WrenchIcon,
    },
    {
      title: t("notifications"),
      url: "/dashboard/notifications",
      icon: BellIcon,
    },
    {
      title: t("browseProducts"),
      url: "/products",
      icon: PackageSearchIcon,
    },
  ]

  const affiliateNav: NavItem[] = [
    {
      title: t("affiliateProgram"),
      url: "/dashboard/earnings",
      icon: GitBranchIcon,
      items: [
        { title: t("earnings"), url: "/dashboard/earnings" },
        { title: t("myLinks"), url: "/dashboard/links" },
        { title: t("payouts"), url: "/dashboard/payouts" },
      ],
    },
  ]

  const bottomNav: NavItem[] = [
    {
      title: t("settings"),
      url: "/dashboard/settings",
      icon: SettingsIcon,
    },
  ]

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
                    {variant === "affiliate" ? t("affiliateSpace") : t("mySpace")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={customerNav} label={t("myAccount")} />
        {variant === "affiliate" && (
          <>
            <SidebarSeparator />
            <NavMain items={affiliateNav} label={t("affiliation")} />
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
                <PackageSearchIcon />
                <span>{t("backToStore")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
