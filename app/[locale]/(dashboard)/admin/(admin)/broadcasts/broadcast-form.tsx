"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  sendBroadcast,
  estimateRecipientCount,
  type BroadcastAudience,
} from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

type Branch = { id: string; name: string; city: string };

interface BroadcastFormProps {
  branches: Branch[];
  isBranchAdmin: boolean;
  adminBranchId?: string | null;
}

const AUDIENCE_OPTIONS: {
  value: BroadcastAudience;
  labelKey: string;
  centralOnly?: boolean;
}[] = [
  { value: "ALL_USERS", labelKey: "audienceAllUsers", centralOnly: true },
  { value: "CUSTOMERS", labelKey: "audienceCustomers", centralOnly: true },
  { value: "AFFILIATES", labelKey: "audienceAffiliates" },
  { value: "BRANCH_STAFF", labelKey: "audienceBranchStaff" },
  { value: "ALL_STAFF", labelKey: "audienceAllStaff", centralOnly: true },
];

export function BroadcastForm({
  branches,
  isBranchAdmin,
  adminBranchId,
}: BroadcastFormProps) {
  const t = useTranslations("adminBroadcasts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [bodyFr, setBodyFr] = useState("");
  const [targetAudience, setTargetAudience] = useState<BroadcastAudience>(
    isBranchAdmin ? "BRANCH_STAFF" : "ALL_USERS",
  );
  const [branchId, setBranchId] = useState(adminBranchId ?? "");
  const [sendEmailCopy, setSendEmailCopy] = useState(false);

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const availableAudiences = AUDIENCE_OPTIONS.filter(
    (o) => !isBranchAdmin || !o.centralOnly,
  );

  const needsBranch = targetAudience === "BRANCH_STAFF" && !isBranchAdmin;

  const audienceLabel =
    AUDIENCE_OPTIONS.find((o) => o.value === targetAudience)?.labelKey ??
    "audienceAllUsers";

  const canSubmit = title.trim() && body.trim() && (!needsBranch || branchId);

  async function handlePreview() {
    if (!canSubmit) return;
    setIsEstimating(true);
    try {
      const result = await estimateRecipientCount({
        targetAudience,
        branchId: branchId || undefined,
      });
      setEstimatedCount(result.count);
      setShowConfirm(true);
    } finally {
      setIsEstimating(false);
    }
  }

  function handleSend() {
    startTransition(async () => {
      const result = await sendBroadcast({
        title,
        body,
        targetAudience,
        branchId: branchId || undefined,
        sendEmailCopy,
        titleFr: titleFr || undefined,
        bodyFr: bodyFr || undefined,
      });
      setShowConfirm(false);
      if (result && "error" in result) {
        toast.error(
          result.error === "No recipients match the selected audience"
            ? t("noRecipients")
            : t("error"),
        );
        return;
      }
      toast.success(
        result && "recipientCount" in result
          ? `${t("sent")} (${t("recipientCount", { count: result.recipientCount })})`
          : t("sent"),
      );
      setTitle("");
      setBody("");
      setTitleFr("");
      setBodyFr("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-4">
        {/* Target Audience */}
        <div className="space-y-2">
          <Label>{t("targetAudience")}</Label>
          <Select
            value={targetAudience}
            onValueChange={(v) => setTargetAudience(v as BroadcastAudience)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableAudiences.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch selector (Central Admin only, when BRANCH_STAFF selected) */}
        {needsBranch && (
          <div className="space-y-2">
            <Label>{t("selectBranch")}</Label>
            <Select
              value={branchId}
              onValueChange={setBranchId}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectBranch")} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — {b.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Title (EN) */}
        <div className="space-y-2">
          <Label>{t("titleLabel")}</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            disabled={isPending}
          />
        </div>

        {/* Body (EN) */}
        <div className="space-y-2">
          <Label>{t("bodyLabel")}</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("bodyPlaceholder")}
            rows={4}
            disabled={isPending}
          />
        </div>

        {/* Title (FR) */}
        <div className="space-y-2">
          <Label>{t("titleFrLabel")}</Label>
          <Input
            value={titleFr}
            onChange={(e) => setTitleFr(e.target.value)}
            placeholder={t("titleFrPlaceholder")}
            disabled={isPending}
          />
        </div>

        {/* Body (FR) */}
        <div className="space-y-2">
          <Label>{t("bodyFrLabel")}</Label>
          <Textarea
            value={bodyFr}
            onChange={(e) => setBodyFr(e.target.value)}
            placeholder={t("bodyFrPlaceholder")}
            rows={4}
            disabled={isPending}
          />
        </div>

        {/* Send email copy */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendEmailCopy"
            checked={sendEmailCopy}
            onCheckedChange={(c) => setSendEmailCopy(c === true)}
            disabled={isPending}
          />
          <Label htmlFor="sendEmailCopy" className="cursor-pointer">
            {t("sendEmailCopy")}
          </Label>
        </div>

        {/* Submit (opens confirmation) */}
        <Button
          onClick={handlePreview}
          disabled={isPending || isEstimating || !canSubmit}
        >
          {isEstimating && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {t("send")}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>{t("confirmDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("confirmSubject")}
              </span>
              <span className="font-medium">{title}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("confirmBody")}</span>
              <p className="mt-1 rounded border p-2 text-xs whitespace-pre-wrap">
                {body}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("confirmAudience")}
              </span>
              <span className="font-medium">{t(audienceLabel)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("confirmRecipients")}
              </span>
              <span className="font-medium">
                {estimatedCount !== null
                  ? t("recipientCount", { count: estimatedCount })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("confirmEmail")}</span>
              <span className="font-medium">
                {sendEmailCopy ? t("confirmEmailYes") : t("confirmEmailNo")}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSend} disabled={isPending}>
              {isPending && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              {isPending ? t("sending") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
