import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { db } from "@/server/db"
import { Badge } from "@/components/ui/badge"
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

export async function generateMetadata() {
  const t = await getTranslations("adminBranches")
  return { title: t("title") }
}

export default async function BranchesPage() {
  await requireRole(["CENTRAL_ADMIN"])
  const t = await getTranslations("adminBranches")

  const branches = await db.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("totalBranches", { count: branches.length })}
        </p>
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
                <TableHead>{t("city")}</TableHead>
                <TableHead>{t("address")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("staffCount", { count: 0 }).replace("0", "#")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t("noBranches")}
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.city}</TableCell>
                    <TableCell>{branch.address}</TableCell>
                    <TableCell>{branch.phone ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? "default" : "secondary"}>
                        {branch.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {t("staffCount", { count: branch._count.users })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
