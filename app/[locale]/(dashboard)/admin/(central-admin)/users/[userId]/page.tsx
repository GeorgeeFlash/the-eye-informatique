import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getUserRemarks, getBranches } from "@/actions/user.actions";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDetailClient } from "./user-detail-client";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const t = await getTranslations("userDetail");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return {
    title: user ? `${user.name ?? user.email} — ${t("title")}` : t("title"),
  };
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const { userId } = await params;

  const [user, remarks, branches] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        branch: { select: { name: true, city: true } },
      },
    }),
    getUserRemarks(userId),
    getBranches(),
  ]);

  if (!user) notFound();

  const t = await getTranslations("userDetail");

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span>{user.name ?? user.email}</span>
            <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
              {user.role}
            </Badge>
            {!user.isActive && (
              <Badge variant="destructive">{t("inactive")}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t("email")}
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t("phone")}
              </dt>
              <dd>{user.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t("branch")}
              </dt>
              <dd>
                {user.branch
                  ? `${user.branch.name} (${user.branch.city})`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t("joined")}
              </dt>
              <dd>{user.createdAt.toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Client component for actions + remarks (interactive parts) */}
      <UserDetailClient
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          currentRole: user.role,
          currentBranchId: user.branchId,
        }}
        branches={branches}
        remarks={remarks.map((r) => ({
          id: r.id,
          text: (r.metadata as { text?: string })?.text ?? "",
          authorName: (r.metadata as { authorName?: string })?.authorName ?? "",
          authorRole: (r.metadata as { authorRole?: string })?.authorRole ?? "",
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
