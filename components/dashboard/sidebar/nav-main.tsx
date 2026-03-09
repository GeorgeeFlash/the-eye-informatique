"use client";

import { Link, usePathname } from "@/i18n/navigation";
import {
  BarChart3Icon,
  BellIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  PackageIcon,
  PackageSearchIcon,
  ServerIcon,
  SettingsIcon,
  ShoppingCartIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  "shopping-cart": ShoppingCartIcon,
  "bar-chart": BarChart3Icon,
  server: ServerIcon,
  settings: SettingsIcon,
  bell: BellIcon,
  package: PackageIcon,
  "package-search": PackageSearchIcon,
  "git-branch": GitBranchIcon,
  briefcase: BriefcaseIcon,
};
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export type NavItem = {
  title: string;
  url: string;
  icon: string;
  items?: { title: string; url: string }[];
};

export function NavMain({
  items,
  label,
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.items.some((sub) =>
                pathname.startsWith(sub.url),
              )}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.items.some((sub) =>
                      pathname.startsWith(sub.url),
                    )}
                  >
                    {(() => {
                      const Icon = ICON_MAP[item.icon];
                      return Icon ? <Icon /> : null;
                    })()}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === sub.url}
                        >
                          <Link href={sub.url}>
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url}>
                  {(() => {
                    const Icon = ICON_MAP[item.icon];
                    return Icon ? <Icon /> : null;
                  })()}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
