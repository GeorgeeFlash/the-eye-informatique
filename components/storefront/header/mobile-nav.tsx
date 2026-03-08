"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MenuIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/blog", label: "Blog" },
  { href: "/guarantee", label: "Garantie" },
] as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sheet open={mounted ? open : undefined} onOpenChange={mounted ? setOpen : undefined}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-semibold">
            The Eye Informatique
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
