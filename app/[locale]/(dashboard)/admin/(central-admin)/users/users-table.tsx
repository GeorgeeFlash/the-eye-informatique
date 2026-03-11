"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTransition, useCallback, useRef, useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Eye, UserCog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { type Locale, ROLES } from "@/lib/constants";
import { RoleChangeDialog } from "./role-change-dialog";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  branchId: string | null;
  createdAt: Date;
  branch: { name: string; city: string } | null;
};

type BranchItem = {
  id: string;
  name: string;
  city: string;
};

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

interface UsersTableProps {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  branches: BranchItem[];
}

export function UsersTable({
  users,
  page,
  totalPages,
  branches,
}: UsersTableProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateParams("search", value);
      }, 400);
    },
    [updateParams],
  );

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
    },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => (
        <Badge variant={ROLE_VARIANT[row.original.role] ?? "outline"}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: "branch",
      header: t("branch"),
      cell: ({ row }) =>
        row.original.branch
          ? `${row.original.branch.name} (${row.original.branch.city})`
          : "—",
    },
    {
      accessorKey: "createdAt",
      header: t("joined"),
      cell: ({ row }) =>
        formatDate(row.original.createdAt, "dd/MM/yyyy", locale),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("viewDetails")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleDialogUser(user)}>
                <UserCog className="mr-2 h-4 w-4" />
                {t("changeRole")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Role filter tabs
  const currentRole = searchParams.get("role") ?? "";
  const roleFilterToolbar = (
    <div className="flex flex-wrap gap-2">
      {["", ...ROLES].map((r) => (
        <Button
          key={r}
          variant={currentRole === r ? "default" : "outline"}
          size="sm"
          onClick={() => updateParams("role", r)}
        >
          {r || t("all")}
        </Button>
      ))}
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {roleFilterToolbar}
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder={t("searchPlaceholder")}
          onSearchChange={handleSearch}
          pageCount={totalPages}
          pageIndex={page - 1}
          pageSize={20}
          onPaginationChange={(newPage) =>
            updateParams("page", String(newPage + 1))
          }
          emptyMessage={t("noUsers")}
        />
      </div>

      {roleDialogUser && (
        <RoleChangeDialog
          user={{
            id: roleDialogUser.id,
            name: roleDialogUser.name,
            email: roleDialogUser.email,
            currentRole: roleDialogUser.role,
            currentBranchId: roleDialogUser.branchId,
          }}
          branches={branches}
          open={!!roleDialogUser}
          onOpenChange={(open: boolean) => {
            if (!open) setRoleDialogUser(null);
          }}
        />
      )}
    </>
  );
}
