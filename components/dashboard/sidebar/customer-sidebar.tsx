import Link from "next/link"
import {
  BotIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  PackageSearchIcon,
  ScrollTextIcon,
  SettingsIcon,
  WrenchIcon,
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

const CUSTOMER_NAV: NavItem[] = [
  {
    title: "Vue d'ensemble",
    url: "/customer",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Mes commandes",
    url: "/customer/orders",
    icon: ScrollTextIcon,
    items: [
      { title: "Commandes", url: "/customer/orders" },
      { title: "Versements", url: "/customer/orders/installments" },
    ],
  },
  {
    title: "Mes réparations",
    url: "/customer/repairs",
    icon: WrenchIcon,
  },
  {
    title: "Parcourir les produits",
    url: "/products",
    icon: PackageSearchIcon,
  },
]

const AFFILIATE_NAV: NavItem[] = [
  {
    title: "Programme Affilié",
    url: "/affiliate",
    icon: GitBranchIcon,
    items: [
      { title: "Tableau de bord", url: "/affiliate" },
      { title: "Mes liens", url: "/affiliate/links" },
      { title: "Paiements", url: "/affiliate/payouts" },
    ],
  },
]

const COMMON_BOTTOM: NavItem[] = [
  {
    title: "AI Assistant",
    url: "/customer/ai",
    icon: BotIcon,
  },
  {
    title: "Paramètres",
    url: "/customer/settings",
    icon: SettingsIcon,
  },
]

type PortalVariant = "customer" | "affiliate"

export function CustomerSidebar({ variant = "customer" }: { variant?: PortalVariant }) {
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
                    {variant === "affiliate" ? "Espace Affilié" : "Mon Espace"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={CUSTOMER_NAV} label="Mon Compte" />
        {variant === "affiliate" && (
          <>
            <SidebarSeparator />
            <NavMain items={AFFILIATE_NAV} label="Affiliation" />
          </>
        )}
        <SidebarSeparator />
        <NavMain items={COMMON_BOTTOM} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href="/">
                <PackageSearchIcon />
                <span>Retour à la boutique</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
