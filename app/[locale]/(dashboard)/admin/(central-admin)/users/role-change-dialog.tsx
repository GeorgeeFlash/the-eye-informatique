"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from "@/lib/constants";
import { assignRole } from "@/actions/user.actions";

interface RoleChangeDialogProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    currentRole: string;
    currentBranchId: string | null;
  };
  branches: { id: string; name: string; city: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleChangeDialog({
  user,
  branches,
  open,
  onOpenChange,
}: RoleChangeDialogProps) {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(user.currentRole);
  const [branchId, setBranchId] = useState(user.currentBranchId ?? "");

  const requiresBranch = role === "STAFF" || role === "ADMIN";

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await assignRole({
        userId: user.id,
        role: role as
          | "CUSTOMER"
          | "AFFILIATE"
          | "STAFF"
          | "ADMIN"
          | "CENTRAL_ADMIN",
        branchId: requiresBranch ? branchId : undefined,
      });

      if (result.error) {
        const msg =
          "formErrors" in result.error
            ? result.error.formErrors?.[0]
            : t("errorAssigningRole");
        toast.error(msg ?? t("errorAssigningRole"));
        return;
      }

      toast.success(t("roleUpdated"));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeRole")}</DialogTitle>
          <DialogDescription>
            {t("changeRoleDescription", { name: user.name ?? user.email })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("selectRole")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresBranch && (
            <div className="space-y-2">
              <Label>{t("selectBranch")}</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (requiresBranch && !branchId)}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
