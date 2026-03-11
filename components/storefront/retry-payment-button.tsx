"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryPayment } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, Loader2Icon } from "lucide-react";

export function RetryPaymentButton({
  orderId,
  label,
}: {
  orderId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    try {
      const result = await retryPayment(orderId, "CM_MTNMOMO");
      if ("redirectUrl" in result && result.redirectUrl) {
        router.push(result.redirectUrl);
      } else if ("error" in result) {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleRetry}
      disabled={loading}
      size="sm"
      className="w-full"
    >
      {loading ? (
        <Loader2Icon className="mr-2 size-4 animate-spin" />
      ) : (
        <RefreshCwIcon className="mr-2 size-4" />
      )}
      {label}
    </Button>
  );
}
