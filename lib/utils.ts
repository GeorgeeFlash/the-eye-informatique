import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an amount in XAF (Central African CFA franc).
 * Outputs: "1 500 XAF" / "1 500 FCFA" depending on locale.
 */
export function formatCurrency(
  amount: number | string,
  locale: "en" | "fr" = "en",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat(locale === "fr" ? "fr-CM" : "en-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format a date in DD/MM/YYYY as required by CON-2.2.
 * Accepts a Date, ISO string, or timestamp.
 */
export function formatDate(
  date: Date | string | number,
  pattern = "dd/MM/yyyy",
  locale: "en" | "fr" = "en",
): string {
  const d = date instanceof Date ? date : new Date(date)
  return format(d, pattern, { locale: locale === "fr" ? fr : enUS })
}

/**
 * Format a date with time: DD/MM/YYYY HH:mm
 */
export function formatDateTime(
  date: Date | string | number,
  locale: "en" | "fr" = "en",
): string {
  return formatDate(date, "dd/MM/yyyy HH:mm", locale)
}

/**
 * Generate a URL-safe slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
