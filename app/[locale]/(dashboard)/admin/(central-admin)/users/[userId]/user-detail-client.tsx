"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserCog, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { RoleChangeDialog } from "../role-change-dialog";
import { addUserRemark } from "@/actions/user.actions";

const ROLE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CUSTOMER: "outline",
  AFFILIATE: "secondary",
  STAFF: "secondary",
  ADMIN: "default",
  CENTRAL_ADMIN: "destructive",
};

interface Remark {
  id: string;
  text: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface UserDetailClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    currentRole: string;
    currentBranchId: string | null;
  };
  branches: { id: string; name: string; city: string }[];
  remarks: Remark[];
}

export function UserDetailClient({
  user,
  branches,
  remarks,
}: UserDetailClientProps) {
  const t = useTranslations("userDetail");
  const router = useRouter();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    startTransition(async () => {
      const result = await addUserRemark({
        userId: user.id,
        text: remarkText.trim(),
      });
      if (result.error) {
        toast.error(t("remarkError"));
        return;
      }
      toast.success(t("remarkAdded"));
      setRemarkText("");
      router.refresh();
    });
  };

  return (
    <>
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToUsers")}
          </Link>
        </Button>
        <Button onClick={() => setRoleDialogOpen(true)}>
          <UserCog className="mr-2 h-4 w-4" />
          {t("changeRole")}
        </Button>
      </div>

      {/* Internal Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>{t("remarks")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add remark form */}
          <div className="space-y-2">
            <Textarea
              placeholder={t("remarkPlaceholder")}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddRemark}
              disabled={isPending || !remarkText.trim()}
              size="sm"
            >
              {t("addRemark")}
            </Button>
          </div>

          {/* Remarks list */}
          {remarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRemarks")}</p>
          ) : (
            <div className="space-y-3">
              {remarks.map((remark) => (
                <div key={remark.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{remark.authorName}</span>
                    <Badge
                      variant={ROLE_VARIANT[remark.authorRole] ?? "outline"}
                      className="text-xs"
                    >
                      {remark.authorRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(remark.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{remark.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <RoleChangeDialog
        user={user}
        branches={branches}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
    </>
  );
}
