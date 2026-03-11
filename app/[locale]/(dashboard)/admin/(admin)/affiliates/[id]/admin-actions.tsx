"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  approveAffiliate,
  rejectAffiliate,
  suspendAffiliate,
  revokeAffiliate,
} from "@/actions/affiliate.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckIcon, XIcon, BanIcon, ShieldOffIcon } from "lucide-react";

export function AffiliateAdminActions({
  profileId,
  status,
}: {
  profileId: string;
  status: string;
}) {
  const t = useTranslations("affiliate");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  function handleApprove() {
    startTransition(async () => {
      await approveAffiliate(profileId);
      toast.success(t("approved"));
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectAffiliate(profileId, reason || undefined);
      toast.success(t("rejected"));
      router.refresh();
    });
  }

  function handleSuspend() {
    if (!reason.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }
    startTransition(async () => {
      await suspendAffiliate(profileId, reason);
      toast.success(t("suspended"));
      router.refresh();
    });
  }

  function handleRevoke() {
    if (!reason.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }
    startTransition(async () => {
      await revokeAffiliate(profileId, reason);
      toast.success(t("revoked"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "PENDING" && (
          <>
            <Button onClick={handleApprove} disabled={isPending} size="sm">
              <CheckIcon className="mr-2 size-4" />
              {t("approve")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
              size="sm"
            >
              <XIcon className="mr-2 size-4" />
              {t("reject")}
            </Button>
          </>
        )}
        {status === "APPROVED" && (
          <>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isPending}
              size="sm"
            >
              <BanIcon className="mr-2 size-4" />
              {t("suspend")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
              size="sm"
            >
              <ShieldOffIcon className="mr-2 size-4" />
              {t("revoke")}
            </Button>
          </>
        )}
        {status === "SUSPENDED" && (
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            size="sm"
          >
            <ShieldOffIcon className="mr-2 size-4" />
            {t("revoke")}
          </Button>
        )}
      </div>

      {(status === "PENDING" ||
        status === "APPROVED" ||
        status === "SUSPENDED") && (
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          className="max-w-sm"
        />
      )}
    </div>
  );
}
