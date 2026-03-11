import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getBranches } from "@/actions/user.actions";
import { getBroadcastHistory } from "@/actions/notification.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BroadcastForm } from "./broadcast-form";

export async function generateMetadata() {
  const t = await getTranslations("adminBroadcasts");
  return { title: t("title") };
}

const AUDIENCE_LABELS: Record<string, string> = {
  ALL_USERS: "audienceAllUsers",
  CUSTOMERS: "audienceCustomers",
  AFFILIATES: "audienceAffiliates",
  BRANCH_STAFF: "audienceBranchStaff",
  ALL_STAFF: "audienceAllStaff",
};

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = await requireRole(["ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("adminBroadcasts");
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const [branches, historyResult] = await Promise.all([
    admin.role === "CENTRAL_ADMIN" ? getBranches() : Promise.resolve([]),
    getBroadcastHistory({ page, pageSize: 10 }),
  ]);

  const isBranchAdmin = admin.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle>{t("compose")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BroadcastForm
            branches={branches}
            isBranchAdmin={isBranchAdmin}
            adminBranchId={admin.branchId}
          />
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {historyResult.broadcasts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noHistory")}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("confirmSubject")}</TableHead>
                    <TableHead>{t("audience")}</TableHead>
                    <TableHead>{t("recipients")}</TableHead>
                    <TableHead>{t("emailSent")}</TableHead>
                    <TableHead>{t("sender")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyResult.broadcasts.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.subject}</TableCell>
                      <TableCell>
                        {t(
                          AUDIENCE_LABELS[b.targetAudience] ?? b.targetAudience,
                        )}
                      </TableCell>
                      <TableCell>{b.recipientCount}</TableCell>
                      <TableCell>
                        {b.emailCopySent
                          ? t("confirmEmailYes")
                          : t("confirmEmailNo")}
                      </TableCell>
                      <TableCell>
                        {b.sender?.name ?? b.sender?.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {historyResult.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from(
                    { length: historyResult.totalPages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <a
                      key={p}
                      href={`?page=${p}`}
                      className={`rounded px-3 py-1 text-sm ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
