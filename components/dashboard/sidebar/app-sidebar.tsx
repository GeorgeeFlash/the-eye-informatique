import Link from "next/link"
import {
  BarChart3Icon,
  BotIcon,
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
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

// Admin & Staff navigation
const ADMIN_NAV: NavItem[] = [
  {
    title: "Vue d'ensemble",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Commandes",
    url: "/dashboard/orders",
    icon: ScrollTextIcon,
    items: [
      { title: "Toutes les commandes", url: "/dashboard/orders" },
      { title: "Versements", url: "/dashboard/orders/installments" },
    ],
  },
  {
    title: "Produits",
    url: "/dashboard/products",
    icon: PackageIcon,
    items: [
      { title: "Catalogue", url: "/dashboard/products" },
      { title: "Catégories", url: "/dashboard/products/categories" },
      { title: "Ajouter un produit", url: "/dashboard/products/new" },
    ],
  },
  {
    title: "Réparations",
    url: "/dashboard/repairs",
    icon: WrenchIcon,
  },
  {
    title: "Affiliés",
    url: "/dashboard/affiliates",
    icon: GitBranchIcon,
    items: [
      { title: "Programme", url: "/dashboard/affiliates" },
      { title: "Paiements", url: "/dashboard/affiliates/payouts" },
    ],
  },
  {
    title: "Blog",
    url: "/dashboard/blog",
    icon: FileTextIcon,
  },
  {
    title: "Analytiques",
    url: "/dashboard/analytics",
    icon: BarChart3Icon,
  },
]

const ADMIN_APPS: NavItem[] = [
  {
    title: "Utilisateurs",
    url: "/dashboard/users",
    icon: UsersIcon,
  },
  {
    title: "Agences",
    url: "/dashboard/branches",
    icon: BuildingIcon,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: MessageSquareIcon,
  },
  {
    title: "Promotions",
    url: "/dashboard/promotions",
    icon: TagIcon,
  },
  {
    title: "AI Chatbot",
    url: "/dashboard/ai",
    icon: BotIcon,
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: SettingsIcon,
  },
]

// Central admin extras
const CENTRAL_ADMIN_NAV: NavItem[] = [
  ...ADMIN_NAV,
  {
    title: "Multi-Agences",
    url: "/central-admin/branches",
    icon: ShieldIcon,
  },
  {
    title: "Journal d'activité",
    url: "/central-admin/logs",
    icon: ScrollTextIcon,
  },
]

type SidebarVariant = "admin" | "central-admin"

export function AppSidebar({ variant = "admin" }: { variant?: SidebarVariant }) {
  const mainNav = variant === "central-admin" ? CENTRAL_ADMIN_NAV : ADMIN_NAV

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
                    {variant === "central-admin" ? "Central Admin" : "Administration"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNav} label="Navigation" />
        <SidebarSeparator />
        <NavMain items={ADMIN_APPS} label="Applications" />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href="/">
                <BriefcaseIcon />
                <span>Voir la boutique</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
