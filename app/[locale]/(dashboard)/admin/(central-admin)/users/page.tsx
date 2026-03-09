import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { getUsers } from "@/actions/user.actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

export async function generateMetadata() {
  const t = await getTranslations("adminUsers")
  return { title: t("title") }
}

const ROLE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CUSTOMER: "outline",
  AFFILIATE: "secondary",
  STAFF: "secondary",
  ADMIN: "default",
  CENTRAL_ADMIN: "destructive",
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>
}) {
  await requireRole(["CENTRAL_ADMIN"])
  const { page: pageParam, role, search } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const t = await getTranslations("adminUsers")
  const locale = await getLocale()

  const { users, totalPages, total } = await getUsers({
    search: search || undefined,
    role: role as Parameters<typeof getUsers>[0] extends { role?: infer R } ? R : never,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("totalUsers", { count: total })}
        </p>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {["", "CUSTOMER", "AFFILIATE", "STAFF", "ADMIN", "CENTRAL_ADMIN"].map(
          (r) => (
            <Button
              key={r}
              asChild
              variant={role === r || (!role && r === "") ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={
                  r
                    ? `?role=${r}${search ? `&search=${search}` : ""}`
                    : `?${search ? `search=${search}` : ""}`
                }
              >
                {r || t("all")}
              </Link>
            </Button>
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("branch")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name ?? "-"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.branch
                        ? `${user.branch.name} (${user.branch.city})`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt, "dd/MM/yyyy", locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?page=${page - 1}${role ? `&role=${role}` : ""}${search ? `&search=${search}` : ""}`}
              >
                {t("all")}
              </Link>
            </Button>
          )}
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?page=${page + 1}${role ? `&role=${role}` : ""}${search ? `&search=${search}` : ""}`}
              >
                {t("all")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
