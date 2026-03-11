import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getUsers, getBranches } from "@/actions/user.actions";
import type { Role } from "@/lib/types";
import { UsersTable } from "./users-table";

export async function generateMetadata() {
  const t = await getTranslations("adminUsers");
  return { title: t("title") };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>;
}) {
  await requireRole(["CENTRAL_ADMIN"]);
  const { page: pageParam, role, search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const t = await getTranslations("adminUsers");

  const [{ users, totalPages, total }, branches] = await Promise.all([
    getUsers({
      search: search || undefined,
      role: role as Role | undefined,
      page,
      pageSize: 20,
    }),
    getBranches(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("totalUsers", { count: total })}
        </p>
      </div>

      <UsersTable
        users={users}
        total={total}
        page={page}
        totalPages={totalPages}
        branches={branches}
      />
    </div>
  );
}
