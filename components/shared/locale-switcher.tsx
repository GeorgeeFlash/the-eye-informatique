"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LOCALES } from "@/lib/constants"

const localeNames: Record<string, string> = {
  en: "English",
  fr: "Français",
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function onLocaleChange(newLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <Select value={locale} onValueChange={onLocaleChange} disabled={isPending}>
      {/* suppressHydrationWarning: Radix generates aria-controls via useId(),
          which differs between Next.js SSR and client due to RSC fiber tree depth */}
      <SelectTrigger className="w-32" suppressHydrationWarning>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((l) => (
          <SelectItem key={l} value={l}>
            {localeNames[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
