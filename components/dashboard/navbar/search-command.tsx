"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative hidden w-48 justify-start gap-2 text-sm text-muted-foreground sm:flex lg:w-64"
      >
        <SearchIcon className="size-4" />
        <span>Rechercher...</span>
        <kbd className="pointer-events-none ml-auto hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden"
        aria-label="Rechercher"
      >
        <SearchIcon className="size-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher dans le tableau de bord..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate("/dashboard")}>Vue d&apos;ensemble</CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/orders")}>Commandes</CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/products")}>Produits</CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/repairs")}>Réparations</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => navigate("/dashboard/products/new")}>
              + Nouveau produit
            </CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/blog/new")}>
              + Nouvel article
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
