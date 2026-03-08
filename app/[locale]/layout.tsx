import type { Metadata } from "next"
import { geistSans, geistMono } from "@/lib/fonts"
import { ClerkProvider } from "@clerk/nextjs"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"
import "../globals.css"

export const metadata: Metadata = {
  title: "The Eye Informatique",
  description: "Votre boutique tech au Cameroun — téléphones, ordinateurs, accessoires et réparations.",
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "en" | "fr")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <ClerkProvider
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      signInFallbackRedirectUrl={`/${locale}`}
      signUpFallbackRedirectUrl={`/${locale}`}
    >
      <html lang={locale} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NextIntlClientProvider messages={messages}>
              {children}
              <Toaster />
            </NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
