import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { SOCIAL_LINKS, APP_NAME } from "@/lib/constants";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

// TikTok icon is not in lucide — small inline SVG
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13v-3.5a6.37 6.37 0 0 0-.88-.07 6.26 6.26 0 0 0 0 12.52 6.27 6.27 0 0 0 6.26-6.27V8.55a8.18 8.18 0 0 0 3.84.96V6.09a4.66 4.66 0 0 1-.01.6Z" />
    </svg>
  );
}

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function StorefrontFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Logo asLink={false} />
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
            {/* Social links */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("followUs")}</p>
              <div className="flex items-center gap-3">
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="size-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="size-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="X"
                >
                  <XIcon className="size-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="size-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="size-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("shop")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("allProducts")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products?condition=NEW"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("newProducts")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products?condition=REFURBISHED"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("refurbished")}
                </Link>
              </li>
              <li>
                <Link
                  href="/guarantee"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
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
                <Link
                  href="/repair"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("repair")}
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("order")}
                </Link>
              </li>
              <li>
                <Link
                  href="/affiliate"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("affiliateProgram")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tNav("blog")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("company")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@theeyeinformatique.cm"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  contact@theeyeinformatique.cm
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. {t("allRightsReserved")}
          </p>
          <div className="flex gap-4">
            <Link
              href="/legal/privacy-policy"
              className="hover:text-foreground transition-colors"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/legal/terms"
              className="hover:text-foreground transition-colors"
            >
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
