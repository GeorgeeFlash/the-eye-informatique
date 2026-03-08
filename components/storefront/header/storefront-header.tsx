"use client"

import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { CartButton } from "@/components/storefront/header/cart-button"
import { MobileNav } from "@/components/storefront/header/mobile-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"

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
  }
)

const CATEGORY_KEYS = [
  { key: "smartphones", href: "/products?category=smartphones" },
  { key: "computers", href: "/products?category=ordinateurs" },
  { key: "accessories", href: "/products?category=accessoires" },
  { key: "networks", href: "/products?category=reseaux" },
  { key: "components", href: "/products?category=composants" },
  { key: "viewAll", href: "/products" },
] as const

export function StorefrontHeader({ userRole }: { userRole?: Role }) {
  const t = useTranslations("nav")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-3">
          <MobileNav />

          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              TEI
            </div>
            <span className="hidden sm:inline-block">{APP_NAME}</span>
          </Link>
        </div>

        {/* Center: desktop navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Products mega-menu */}
            <NavigationMenuItem>
              {/* suppressHydrationWarning: Radix generates id/aria-controls via useId(),
                  which differs between Next.js SSR and client due to RSC fiber tree depth */}
              <NavigationMenuTrigger suppressHydrationWarning>{t("products")}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-125 gap-2 p-4 md:grid-cols-2">
                  {CATEGORY_KEYS.map((cat) => (
                    <ListItem key={cat.href} href={cat.href} title={t(`categories.${cat.key}`)}>
                      {t(`categories.${cat.key}Desc`)}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Blog */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/blog">
                  {t("blog")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Guarantee */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/guarantee">
                  {t("guarantee")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <CartButton />
          <AuthActions userRole={userRole} />
        </div>
      </div>
    </header>
  )
}

// Helper component for NavigationMenuContent list items
function ListItem({
  title,
  children,
  href,
  className,
}: {
  title: string
  children: React.ReactNode
  href: string
  className?: string
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
