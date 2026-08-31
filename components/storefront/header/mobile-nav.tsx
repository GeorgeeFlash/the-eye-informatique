"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MenuIcon, SmartphoneIcon, LaptopIcon, HeadphonesIcon, NetworkIcon, CpuIcon, LayersIcon } from "lucide-react";
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

const NAV_KEYS = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
] as const;

const CATEGORIES = [
  { href: "/products?category=smartphones", key: "smartphones", icon: SmartphoneIcon },
  { href: "/products?category=ordinateurs", key: "computers", icon: LaptopIcon },
  { href: "/products?category=accessoires", key: "accessories", icon: HeadphonesIcon },
  { href: "/products?category=reseaux", key: "networks", icon: NetworkIcon },
  { href: "/products?category=composants", key: "components", icon: CpuIcon },
  { href: "/products", key: "viewAll", icon: LayersIcon },
] as const;

export function MobileNav() {
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
      <SheetContent side="left" className="w-80 p-6 flex flex-col justify-between">
        <div>
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-left text-base font-semibold">
              <Logo asLink={false} showName />
            </SheetTitle>
          </SheetHeader>

          {/* Main Pages */}
          <nav className="mt-4 flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-3 py-1">
              Menu
            </span>
            {NAV_KEYS.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <Separator className="my-4" />

          {/* Categories */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-3 py-1">
              {t("products")}
            </span>
            {CATEGORIES.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="size-4 text-primary/70" />
                <span>{t(`categories.${key}`)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Eye Informatique
        </div>
      </SheetContent>
    </Sheet>
  );
}
