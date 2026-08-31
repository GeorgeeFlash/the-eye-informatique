import type { Metadata, ResolvingMetadata, Viewport } from "next";
import { cache } from "react";
import { geistSans, geistMono } from "@/lib/fonts";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { SerwistProvider } from "@/app/serwist";
import { sanityFetch } from "@/sanity/lib/live";
import { SanityLive } from "@/sanity/lib/live";
import { CartSyncProvider } from "@/components/shared/cart-sync-provider";
import { HERO_BANNER_QUERY } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import "../globals.css";
import { Locale } from "@/lib/constants";

const APP_NAME = "The Eye Informatique";
const APP_DEFAULT_TITLE = "The Eye Informatique";
const APP_TITLE_TEMPLATE = "%s - The Eye Informatique";
const APP_DESCRIPTION =
  "Votre boutique tech au Cameroun — téléphones, ordinateurs, accessoires et réparations.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const getHeroBanner = cache(async () => {
  try {
    const { data } = await sanityFetch({ query: HERO_BANNER_QUERY });
    return data;
  } catch {
    return null;
  }
});

export async function generateMetadata(
  _: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const previousImages = (await parent).openGraph?.images || [];

  const heroBanner = await getHeroBanner();
  let heroImage = new URL("/assets/banner.png", APP_URL).toString();

  if (heroBanner?.image) {
    try {
      heroImage = urlFor(heroBanner.image).width(1200).height(630).url();
    } catch {
      // keep fallback
    }
  }

  return {
    metadataBase: new URL(APP_URL),
    applicationName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    manifest: "/site.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: APP_DEFAULT_TITLE,
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
      images: [heroImage, ...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
      images: [heroImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <ClerkProvider
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      signInFallbackRedirectUrl={`/${locale}`}
      signUpFallbackRedirectUrl={`/${locale}/complete-registration`}
    >
      <html
        lang={locale}
        translate="no"
        className="notranslate"
        suppressHydrationWarning
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NextIntlClientProvider messages={messages}>
              {process.env.NODE_ENV === "production" ? (
                <SerwistProvider swUrl="/serwist/sw.js">
                  <CartSyncProvider>{children}</CartSyncProvider>
                </SerwistProvider>
              ) : (
                <CartSyncProvider>{children}</CartSyncProvider>
              )}
              <Toaster richColors />
              <SanityLive />
            </NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
