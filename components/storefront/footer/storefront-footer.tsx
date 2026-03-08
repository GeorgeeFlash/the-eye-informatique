import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { APP_NAME } from "@/lib/constants"

const FOOTER_LINKS = {
  boutique: [
    { href: "/products", label: "Tous les produits" },
    { href: "/products?condition=NEW", label: "Neufs" },
    { href: "/products?condition=REFURBISHED", label: "Reconditionnés" },
    { href: "/guarantee", label: "Garantie" },
  ],
  services: [
    { href: "/repair", label: "Réparation" },
    { href: "/checkout", label: "Commander" },
    { href: "/affiliate", label: "Programme Affilié" },
    { href: "/blog", label: "Blog" },
  ],
  contact: [
    { href: "#", label: "Yaoundé — Siège" },
    { href: "#", label: "Douala" },
    { href: "mailto:contact@theeyeinformatique.cm", label: "contact@theeyeinformatique.cm" },
    { href: "tel:+237000000000", label: "+237 000 000 000" },
  ],
}

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                TEI
              </div>
              <span className="font-bold">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre boutique tech de confiance au Cameroun. Téléphones, ordinateurs, accessoires et réparations.
            </p>
          </div>

          {/* Boutique */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Boutique</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.boutique.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Services</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.services.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Contact</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.contact.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              Conditions d&apos;utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
