"use client";

import { useState } from "react";
import { retryPayment } from "@/actions/order.actions";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export function RetryPaymentButton({
  orderId,
  label,
  gateway = "CM_MTNMOMO",
}: {
  orderId: string;
  label: string;
  gateway?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    try {
      const result = await retryPayment(orderId, gateway);
      if ("redirectUrl" in result && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if ("error" in result) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to retry payment. Please try again.");
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
