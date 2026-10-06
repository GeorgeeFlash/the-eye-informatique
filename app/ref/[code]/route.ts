import { NextRequest, NextResponse } from "next/server";
import { trackAffiliateClick } from "@/actions/affiliate.actions";
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_TTL_DAYS } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const result = await trackAffiliateClick(code);

    if (!result?.targetUrl) {
      return NextResponse.redirect(new URL("/", request.url), 307);
    }

    // Safely resolve the destination URL
    let destinationUrl: URL;
    try {
      destinationUrl = new URL(result.targetUrl, request.url);
      // Security: prevent open redirect to external domains
      if (destinationUrl.origin !== request.nextUrl.origin) {
        destinationUrl = new URL("/", request.url);
      }
    } catch {
      destinationUrl = new URL("/", request.url);
    }

    const response = NextResponse.redirect(destinationUrl, 307);

    // Set the referral cookie on the response
    response.cookies.set(
      REFERRAL_COOKIE_NAME,
      `${result.affiliateId}:${result.linkId}`,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: REFERRAL_COOKIE_TTL_DAYS * 24 * 60 * 60,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("Referral redirection error:", error);
    return NextResponse.redirect(new URL("/", request.url), 307);
  }
}
