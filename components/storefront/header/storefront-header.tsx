import Link from "next/link"
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
import { APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"

const PRODUCT_CATEGORIES = [
  {
    title: "Smartphones",
    href: "/products?category=smartphones",
    description: "Téléphones Android et iOS, neufs et reconditionnés",
  },
  {
    title: "Ordinateurs",
    href: "/products?category=ordinateurs",
    description: "Laptops, desktops et stations de travail",
  },
  {
    title: "Accessoires",
    href: "/products?category=accessoires",
    description: "Câbles, chargeurs, étuis et plus encore",
  },
  {
    title: "Réseaux & Sécurité",
    href: "/products?category=reseaux",
    description: "Routeurs, switches, caméras de surveillance",
  },
  {
    title: "Composants",
    href: "/products?category=composants",
    description: "RAM, SSD, cartes graphiques, processeurs",
  },
  {
    title: "Voir tout",
    href: "/products",
    description: "Parcourir l'ensemble du catalogue",
  },
]

export function StorefrontHeader() {
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
              <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-125 gap-2 p-4 md:grid-cols-2">
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <ListItem key={cat.href} href={cat.href} title={cat.title}>
                      {cat.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Blog */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/blog">
                  Blog
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Guarantee */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/guarantee">
                  Garantie
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
          <ClerkLoading>
            <Skeleton className="h-8 w-8 rounded-full" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
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
