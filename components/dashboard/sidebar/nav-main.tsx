"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  BarChart3Icon,
  BellIcon,
  BookOpenTextIcon,
  BoxesIcon,
  Building2Icon,
  BriefcaseIcon,
  ChevronRightIcon,
  GitBranchIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PackageIcon,
  PackageSearchIcon,
  ReceiptTextIcon,
  ServerIcon,
  SettingsIcon,
  ShoppingCartIcon,
  TagsIcon,
  UsersIcon,
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
  boxes: BoxesIcon,
  tags: TagsIcon,
  receipt: ReceiptTextIcon,
  megaphone: MegaphoneIcon,
  newspaper: NewspaperIcon,
  users: UsersIcon,
  branch: Building2Icon,
  knowledge: BookOpenTextIcon,
  images: ImagesIcon,
};
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

type NavMatch = "exact" | "prefix";

export type NavSubItem = {
  title: string;
  url: string;
  match?: NavMatch;
};

export type NavItem = {
  title: string;
  url?: string;
  icon: string;
  match?: NavMatch;
  items?: NavSubItem[];
};

function matchesPath(
  pathname: string,
  url?: string,
  match: NavMatch = "exact",
) {
  if (!url) {
    return false;
  }

  if (match === "prefix") {
    return pathname === url || pathname.startsWith(`${url}/`);
  }

  return pathname === url;
}

function getBestMatch(items: NavSubItem[] | undefined, pathname: string) {
  return items
    ?.filter((item) => matchesPath(pathname, item.url, item.match))
    .sort((left, right) => right.url.length - left.url.length)[0];
}

export function NavMain({
  items,
  label,
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();
  const activeItemTitle =
    items.find(
      (item) =>
        item.items?.some((sub) => matchesPath(pathname, sub.url, sub.match)) ||
        matchesPath(pathname, item.url, item.match),
    )?.title ?? null;
  const [manualOpenItem, setManualOpenItem] = useState<string | null>(null);
  const openItem = manualOpenItem ?? activeItemTitle;

  return (
    <SidebarGroup className="px-3 py-0">
      {label && (
        <SidebarGroupLabel className="h-auto px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const activeSubItem = getBestMatch(item.items, pathname);
          const isItemActive =
            Boolean(activeSubItem) ||
            matchesPath(pathname, item.url, item.match);
          const isOpen = openItem === item.title;

          return item.items?.length ? (
            <SidebarMenuItem key={item.title} className="overflow-hidden">
              <SidebarMenuButton
                type="button"
                tooltip={item.title}
                isActive={isItemActive}
                aria-expanded={isOpen}
                onClick={() =>
                  setManualOpenItem((current) =>
                    current === item.title ? null : item.title,
                  )
                }
                className="group/nav-button h-11 rounded-2xl px-3 transition-all duration-200 hover:bg-sidebar-accent/70 data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-sm"
              >
                {(() => {
                  const Icon = ICON_MAP[item.icon];
                  return Icon ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-sidebar-border/70 bg-background/80 text-sidebar-foreground/60 transition-colors group-data-[active=true]/nav-button:border-primary/20 group-data-[active=true]/nav-button:bg-primary/10 group-data-[active=true]/nav-button:text-primary">
                      <Icon className="size-4" />
                    </span>
                  ) : null;
                })()}
                <span className="font-medium text-sidebar-foreground/85">
                  {item.title}
                </span>
                <ChevronRightIcon
                  className={`ml-auto size-4 text-sidebar-foreground/45 transition-transform duration-300 ${
                    isOpen ? "rotate-90" : "rotate-0"
                  }`}
                />
              </SidebarMenuButton>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <SidebarMenuSub className="mx-0 mt-2 gap-1 border-l-0 px-0 py-0 pl-11">
                    {item.items.map((sub) => {
                      const isSubActive = activeSubItem?.url === sub.url;
                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className="h-9 rounded-xl px-3 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                          >
                            <Link href={sub.url}>
                              <span className={`size-1.5 rounded-full transition-colors ${isSubActive ? "bg-primary" : "bg-current/35"}`} />
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </div>
              </div>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={matchesPath(pathname, item.url, item.match)}
                className="group/nav-button h-11 rounded-2xl px-3 transition-all duration-200 hover:bg-sidebar-accent/70 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-xs"
              >
                <Link href={item.url ?? "#"}>
                  {(() => {
                    const Icon = ICON_MAP[item.icon];
                    return Icon ? (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-sidebar-border/70 bg-background/80 text-sidebar-foreground/60 transition-colors group-data-[active=true]/nav-button:border-primary/30 group-data-[active=true]/nav-button:bg-primary/15 group-data-[active=true]/nav-button:text-primary">
                        <Icon className="size-4" />
                      </span>
                    ) : null;
                  })()}
                  <span className="font-medium group-data-[active=true]/nav-button:font-semibold">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
