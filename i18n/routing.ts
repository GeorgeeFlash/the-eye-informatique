import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "fr",
  // Omit locale prefix for the default locale (fr)
  localePrefix: "as-needed",
})
