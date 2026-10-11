"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  MenuIcon,
  SmartphoneIcon,
  LaptopIcon,
  HeadphonesIcon,
  NetworkIcon,
  CpuIcon,
  LayersIcon,
  HomeIcon,
  NewspaperIcon,
  InfoIcon,
  ShoppingBagIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/lib/types";

const DrawerAuth = dynamic(
  () => import("@/components/storefront/header/auth-actions"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-11 rounded-md" />
        <Skeleton className="h-11 rounded-md" />
      </div>
    ),
  },
);

const NAV_KEYS = [
  { href: "/", key: "home", icon: HomeIcon },
  { href: "/products", key: "products", icon: ShoppingBagIcon },
  { href: "/blog", key: "blog", icon: NewspaperIcon },
  { href: "/about", key: "about", icon: InfoIcon },
] as const;

const CATEGORIES = [
  { href: "/products?category=smartphones", key: "smartphones", icon: SmartphoneIcon },
  { href: "/products?category=ordinateurs", key: "computers", icon: LaptopIcon },
  { href: "/products?category=accessoires", key: "accessories", icon: HeadphonesIcon },
  { href: "/products?category=reseaux", key: "networks", icon: NetworkIcon },
  { href: "/products?category=composants", key: "components", icon: CpuIcon },
  { href: "/products", key: "viewAll", icon: LayersIcon },
] as const;

export function MobileNav({ userRole }: { userRole?: Role }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* suppressHydrationWarning: Radix generates aria-controls via useId() which
            can differ between Next.js SSR and client due to RSC fiber tree differences */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label={t("openMenu")}
          suppressHydrationWarning
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-80 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60">
          <SheetTitle className="text-left">
            <Logo asLink={false} showName />
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Main Pages */}
          <nav className="px-3">
            <span className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase block">
              Menu
            </span>
            {NAV_KEYS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary active:bg-primary/20 group"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted/70 group-hover:bg-primary/15 transition-colors">
                  <Icon className="size-4 text-primary/70 group-hover:text-primary" />
                </span>
                <span className="flex-1">{t(key)}</span>
                <ChevronRightIcon className="size-3.5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
              </Link>
            ))}
          </nav>

          <Separator className="my-3 mx-3" />

          {/* Categories */}
          <div className="px-3">
            <span className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase block">
              {t("products")}
            </span>
            {CATEGORIES.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary active:bg-primary/20 group"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted/70 group-hover:bg-primary/15 transition-colors">
                  <Icon className="size-4 text-primary/50 group-hover:text-primary" />
                </span>
                <span className="flex-1">{t(`categories.${key}`)}</span>
                <ChevronRightIcon className="size-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          <DrawerAuth
            userRole={userRole}
            placement="drawer"
            onNavigate={() => setOpen(false)}
          />
          <div className="flex items-center gap-2">
            <LocaleSwitcher className="h-9 min-w-0 flex-1" />
            <ThemeToggle />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            © {new Date().getFullYear()} The Eye Informatique
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
