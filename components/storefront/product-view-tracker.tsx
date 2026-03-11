"use client";

import { useEffect } from "react";
import { trackProductPageView } from "@/actions/analytics.actions";

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackProductPageView(productId).catch(() => {
      // Silently ignore tracking failures — analytics should never break UX
    });
  }, [productId]);

  return null;
}
