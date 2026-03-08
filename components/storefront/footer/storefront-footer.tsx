import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Separator } from "@/components/ui/separator"
import { APP_NAME } from "@/lib/constants"

export function StorefrontFooter() {
  const t = useTranslations("footer")
  const tNav = useTranslations("nav")

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
              {t("tagline")}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("shop")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link href="/products?condition=NEW" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("newProducts")}
                </Link>
              </li>
              <li>
                <Link href="/products?condition=REFURBISHED" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("refurbished")}
                </Link>
              </li>
              <li>
                <Link href="/guarantee" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {tNav("guarantee")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("services")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/repair" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("repair")}
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("order")}
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("affiliateProgram")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {tNav("blog")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("contact")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {t("headquarters")}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Douala
                </Link>
              </li>
              <li>
                <Link href="mailto:contact@theeyeinformatique.cm" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  contact@theeyeinformatique.cm
                </Link>
              </li>
              <li>
                <Link href="tel:+237000000000" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  +237 000 000 000
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {APP_NAME}. {t("allRightsReserved")}</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
