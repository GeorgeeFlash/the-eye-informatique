"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveReview,
  rejectReview,
  deleteReview,
} from "@/actions/review.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReviewActionsProps {
  reviewId: string;
  status: string;
}

export function ReviewActions({ reviewId, status }: ReviewActionsProps) {
  const t = useTranslations("reviewModeration");
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      await approveReview(reviewId);
      toast.success(t("approved"));
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }
    startTransition(async () => {
      await rejectReview(reviewId, reason.trim());
      toast.success(t("rejected"));
      setShowRejectInput(false);
      setReason("");
    });
  }

  function handleDelete() {
    if (!reason.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }
    startTransition(async () => {
      await deleteReview(reviewId, reason.trim());
      toast.success(t("deleted"));
      setReason("");
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {status === "PENDING" && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleApprove}
          >
            {t("approve")}
          </Button>
          {showRejectInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="h-8 w-40"
                disabled={isPending}
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleReject}
              >
                {t("confirmReject")}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setShowRejectInput(true)}
            >
              {t("reject")}
            </Button>
          )}
        </>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            {t("delete")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending || !reason.trim()}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
