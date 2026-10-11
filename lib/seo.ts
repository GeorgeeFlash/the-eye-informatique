import type { Metadata } from "next";
import { APP_NAME, APP_URL, DEFAULT_LOCALE } from "@/lib/constants";

const NON_IMAGE_EXTENSION = /\.(mp4|m4v|mov|webm|avi)(?:$|[?#])/i;

export type ProductOgImageSource = {
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
};

export type SocialImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export function resolveAbsoluteHttpUrl(
  value: string,
  baseUrl: string = APP_URL,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parse = (input: string) => {
    const url = new URL(input, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  };

  try {
    return parse(trimmed);
  } catch {
    try {
      return parse(encodeURI(trimmed));
    } catch {
      return null;
    }
  }
}

/**
 * Primary product photo, then the rest in their existing order.
 * Skips blank URLs and video files, which are not valid Open Graph images.
 */
export function selectProductOgImage(
  images: ProductOgImageSource[] | null | undefined,
  altFallback: string,
  baseUrl: string = APP_URL,
): SocialImage | null {
  if (!images?.length) return null;

  const ordered = [
    ...images.filter((image) => image.isPrimary),
    ...images.filter((image) => !image.isPrimary),
  ];

  for (const image of ordered) {
    if (!image.url?.trim() || NON_IMAGE_EXTENSION.test(image.url)) continue;
    const url = resolveAbsoluteHttpUrl(image.url, baseUrl);
    if (!url) continue;
    return { url, alt: image.alt?.trim() || altFallback };
  }

  return null;
}

function readFallbackImage(item: unknown, baseUrl: string): SocialImage | null {
  if (typeof item === "string" || item instanceof URL) {
    const url = resolveAbsoluteHttpUrl(item.toString(), baseUrl);
    return url ? { url } : null;
  }

  if (!item || typeof item !== "object" || !("url" in item)) return null;

  const record = item as {
    url?: unknown;
    alt?: unknown;
    width?: unknown;
    height?: unknown;
  };
  const raw =
    typeof record.url === "string"
      ? record.url
      : record.url instanceof URL
        ? record.url.toString()
        : null;
  if (!raw) return null;

  const url = resolveAbsoluteHttpUrl(raw, baseUrl);
  if (!url) return null;

  const width = record.width != null ? Number(record.width) : undefined;
  const height = record.height != null ? Number(record.height) : undefined;

  return {
    url,
    ...(typeof record.alt === "string" && record.alt ? { alt: record.alt } : {}),
    ...(width && Number.isFinite(width) ? { width } : {}),
    ...(height && Number.isFinite(height) ? { height } : {}),
  };
}

function fallbackImages(
  images: unknown,
  baseUrl: string,
): SocialImage[] {
  const list = Array.isArray(images) ? images : images == null ? [] : [images];
  return list.flatMap((item) => {
    const image = readFallbackImage(item, baseUrl);
    return image ? [image] : [];
  });
}

export function plainShareText(
  value: string | null | undefined,
  max = 160,
): string {
  if (!value) return "";
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max).trim();
}

export function localePath(locale: string, pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return `/${locale}${normalized}`;
}

/**
 * Product shares use one image. When a product photo exists it is the only
 * `og:image`; the app image is emitted only when that photo is missing.
 * Crawlers that see both (WhatsApp, Facebook) prefer the app banner.
 * Dimensions are omitted because product photos are not 1200×630, and a
 * mismatched size hint makes those crawlers skip the file.
 */
export function buildProductSocialMetadata({
  title,
  description,
  images,
  fallbackImages: parentImages,
  pageUrl,
  baseUrl = APP_URL,
}: {
  title: string;
  description: string;
  images: ProductOgImageSource[] | null | undefined;
  fallbackImages?: unknown;
  pageUrl?: string | null;
  baseUrl?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const productImage = selectProductOgImage(images, title, baseUrl);
  const imagesForShare = productImage
    ? [productImage]
    : fallbackImages(parentImages, baseUrl);

  const openGraphImages =
    imagesForShare.length > 0 ? imagesForShare : undefined;

  return {
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      title,
      description,
      ...(pageUrl ? { url: pageUrl } : {}),
      ...(openGraphImages ? { images: openGraphImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(openGraphImages
        ? { images: openGraphImages.map((image) => image.url) }
        : {}),
    },
  };
}
