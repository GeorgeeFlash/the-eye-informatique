"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCartStore } from "@/stores/cart.store";

/**
 * Invisible component that syncs the local Zustand cart with the server
 * when a Clerk session becomes active, and clears the `_authed` flag on
 * sign-out.  Mount once in the root layout.
 */
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const mergeOnLogin = useCartStore((s) => s.mergeOnLogin);
  const setLoggedOut = useCartStore((s) => s.setLoggedOut);
  const didSync = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && !didSync.current) {
      didSync.current = true;
      mergeOnLogin().catch(() => {});
    }

    if (!isSignedIn) {
      didSync.current = false;
      setLoggedOut();
    }
  }, [isLoaded, isSignedIn, mergeOnLogin, setLoggedOut]);

  return <>{children}</>;
}
