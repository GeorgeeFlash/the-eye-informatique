import {
  buildProductSocialMetadata,
  resolveAbsoluteHttpUrl,
  selectProductOgImage,
} from "@/lib/seo";

const BASE = "https://theeye.example";
const BLOB =
  "https://store.public.blob.vercel-storage.com/products/phone.jpg";
const APP_IMAGE = "https://cdn.sanity.io/images/hero.jpg?w=1200&h=630";

describe("product open graph images", () => {
  it("keeps an absolute product image and does not prefix the app origin", () => {
    expect(resolveAbsoluteHttpUrl(BLOB, BASE)).toBe(BLOB);
    expect(
      selectProductOgImage([{ url: BLOB, isPrimary: true }], "Phone", BASE),
    ).toEqual({ url: BLOB, alt: "Phone" });
  });

  it("resolves a root-relative product image against the app origin", () => {
    expect(
      selectProductOgImage(
        [{ url: "/assets/samples/products/watch_1.webp", alt: "Watch" }],
        "Watch",
        BASE,
      ),
    ).toEqual({
      url: "https://theeye.example/assets/samples/products/watch_1.webp",
      alt: "Watch",
    });
  });

  it("prefers the primary image over an earlier gallery image", () => {
    const selected = selectProductOgImage(
      [
        { url: "https://cdn.example/side.jpg", isPrimary: false, alt: "Side" },
        { url: BLOB, isPrimary: true, alt: "Front" },
      ],
      "Phone",
      BASE,
    );
    expect(selected?.url).toBe(BLOB);
    expect(selected?.alt).toBe("Front");
  });

  it("skips videos and blank urls, then uses the next photo", () => {
    const selected = selectProductOgImage(
      [
        { url: "   ", isPrimary: true },
        { url: "https://cdn.example/clip.mp4", isPrimary: true },
        { url: "https://cdn.example/photo.webp", alt: "Photo" },
      ],
      "Phone",
      BASE,
    );
    expect(selected).toEqual({
      url: "https://cdn.example/photo.webp",
      alt: "Photo",
    });
  });

  it("emits only the product image when one is available", () => {
    const metadata = buildProductSocialMetadata({
      title: "Phone",
      description: "A phone",
      images: [{ url: BLOB, alt: "Phone", isPrimary: true }],
      fallbackImages: [APP_IMAGE],
      baseUrl: BASE,
    });

    expect(metadata.openGraph?.images).toEqual([{ url: BLOB, alt: "Phone" }]);
    expect(metadata.twitter?.images).toEqual([BLOB]);
  });

  it("uses the app image only when the product has no usable photo", () => {
    const metadata = buildProductSocialMetadata({
      title: "Phone",
      description: "A phone",
      images: [{ url: "https://cdn.example/demo.webm" }],
      fallbackImages: [{ url: APP_IMAGE, width: 1200, height: 630 }],
      baseUrl: BASE,
    });

    expect(metadata.openGraph?.images).toEqual([
      { url: APP_IMAGE, width: 1200, height: 630 },
    ]);
    expect(metadata.twitter?.images).toEqual([APP_IMAGE]);
  });
});
