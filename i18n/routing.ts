import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // Omit locale prefix for the default locale (en)
  localePrefix: "as-needed",
})
