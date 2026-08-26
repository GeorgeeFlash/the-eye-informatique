import { cache } from "react";
import { redirect } from "next/navigation";
import { trackAffiliateClick, getAffiliateLink } from "@/actions/affiliate.actions";
import { getProductBySlug } from "@/actions/product.actions";
import { APP_URL, REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_TTL_DAYS } from "@/lib/constants";
import { cookies } from "next/headers";
import type { Metadata, ResolvingMetadata } from "next";

const getProductBySlugCached = cache(getProductBySlug);
const getAffiliateLinkCached = cache(getAffiliateLink);

interface Props {
  params: Promise<{ code: string }>;
}

function resolveSlugFromTargetUrl(targetUrl: string): string | null {
  try {
    const url = new URL(targetUrl, APP_URL);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { code } = await params;
  const result = await getAffiliateLinkCached(code);

  if (!result?.targetUrl) {
    return { title: "Not Found" };
  }

  const previousImages = (await parent).openGraph?.images || [];

  const slug = resolveSlugFromTargetUrl(result.targetUrl);

  if (!slug) {
    return { title: "The Eye Informatique" };
  }

  const product = await getProductBySlugCached(slug);

  if (!product) {
    return { title: "The Eye Informatique" };
  }

  const image = product.images[0]?.url ?? "/assets/banner.png";
  const productImage = {
    url: image,
    width: 1200,
    height: 630,
    alt: product.name,
  };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? "",
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: [productImage, ...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: [productImage],
    },
  };
}

export default async function RefPage({ params }: Props) {
  const { code } = await params;
  const result = await trackAffiliateClick(code);

  if (!result?.targetUrl) {
    redirect("/");
  }

  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, `${result.affiliateId}:${result.linkId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFERRAL_COOKIE_TTL_DAYS * 24 * 60 * 60,
    path: "/",
  });

  const slug = resolveSlugFromTargetUrl(result.targetUrl);

  if (slug) {
    redirect(`/products/${slug}`);
  }

  redirect("/");
}
