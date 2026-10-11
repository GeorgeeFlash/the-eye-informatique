"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { CartButton } from "@/components/storefront/header/cart-button";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { MobileNav } from "@/components/storefront/header/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/shared/logo";
import { SearchBar } from "@/components/storefront/search-bar";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

// ssr:false is required — Clerk has no auth context on the server, so ClerkLoading/ClerkLoaded
// always mismatch between SSR and client hydration. Opting out of SSR entirely is the
// only reliable solution.
const AuthActions = dynamic(
  () => import("@/components/storefront/header/auth-actions"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
        <Skeleton className="hidden sm:block h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    ),
  },
);

const CATEGORY_KEYS = [
  { key: "smartphones", href: "/products?category=smartphones" },
  { key: "computers", href: "/products?category=ordinateurs" },
  { key: "accessories", href: "/products?category=accessoires" },
  { key: "networks", href: "/products?category=reseaux" },
  { key: "components", href: "/products?category=composants" },
  { key: "viewAll", href: "/products" },
] as const;

export function StorefrontHeader({ userRole }: { userRole?: Role }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md transition-all">
      {/* Brand Accent Top Stripe */}
      <div className="h-0.75 w-full bg-linear-to-r from-primary via-primary/80 to-destructive" />

      {/* Main header row */}
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <MobileNav userRole={userRole} />
          <Logo size="md" showName={false} className="sm:hidden" />
          <Logo size="md" className="hidden sm:inline-flex" />
        </div>

        {/* Center: search bar (hidden on mobile, shown on sm+) */}
        <div className="hidden sm:flex flex-1 mx-4 lg:mx-8 max-w-md min-w-0">
          <SearchBar />
        </div>

        {/* Center: desktop navigation (only on md+) */}
        <NavigationMenu className="hidden md:flex shrink-0">
          <NavigationMenuList className="gap-1">
            {/* Products mega-menu */}
            <NavigationMenuItem>
              {/* suppressHydrationWarning: Radix generates id/aria-controls via useId(),
                  which differs between Next.js SSR and client due to RSC fiber tree depth */}
              <NavigationMenuTrigger suppressHydrationWarning className="font-semibold transition-colors hover:text-primary">
                {t("products")}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-130 gap-2.5 p-4 md:grid-cols-2">
                  {CATEGORY_KEYS.map((cat) => (
                    <ListItem
                      key={cat.href}
                      href={cat.href}
                      title={t(`categories.${cat.key}`)}
                    >
                      {t(`categories.${cat.key}Desc`)}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Blog */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "font-semibold transition-colors hover:text-primary")}
              >
                <Link href="/blog">{t("blog")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* About */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), "font-semibold transition-colors hover:text-primary")}
              >
                <Link href="/about">{t("about")}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <LocaleSwitcher className="hidden sm:flex" />
          <ThemeToggle className="hidden sm:inline-flex" />
          <CartButton />
          <AuthActions userRole={userRole} />
        </div>
      </div>

      {/* Mobile search bar row */}
      <div className="sm:hidden border-t border-border/40 px-3 py-2 bg-background/80 backdrop-blur-sm">
        <SearchBar />
      </div>

      <CartSheet />
    </header>
  );
}

// Helper component for NavigationMenuContent list items
function ListItem({
  title,
  children,
  href,
  className,
}: {
  title: string;
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "group block select-none space-y-1 rounded-lg border border-transparent p-3 leading-none no-underline outline-none transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary focus:border-primary/20 focus:bg-primary/5",
            className,
          )}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            <span className="size-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
            {title}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-muted-foreground/90">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
