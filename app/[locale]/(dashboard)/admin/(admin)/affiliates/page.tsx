import { getTranslations } from "next-intl/server"
import { getAdminAffiliates } from "@/actions/affiliate.actions"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STATUSES = ["", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"] as const

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const t = await getTranslations("affiliate")
  const page = Number(sp.page) || 1
  const status = typeof sp.status === "string" ? sp.status : ""

  const { affiliates, total, totalPages } = await getAdminAffiliates({
    page,
    status: status || undefined,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("adminTitle")}</h1>
        <p className="text-muted-foreground">{t("adminDescription")}</p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s || "all"}
            variant={status === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/admin/affiliates?status=${s}`}>
              {s ? t(`affiliateStatus.${s}`) : t("allAffiliates")}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("affiliates")}</CardTitle>
          <CardDescription>{t("totalAffiliates", { count: total })}</CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAffiliates")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("referrals")}</TableHead>
                  <TableHead>{t("totalEarned")}</TableHead>
                  <TableHead>{t("joined")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.user.name}</TableCell>
                    <TableCell className="text-sm">{a.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "APPROVED"
                            ? "default"
                            : a.status === "PENDING"
                              ? "secondary"
                              : a.status === "SUSPENDED"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {t(`affiliateStatus.${a.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{a._count.referrals}</TableCell>
                    <TableCell>{formatCurrency(a.totalEarned.toNumber())}</TableCell>
                    <TableCell>{formatDate(a.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/affiliates/${a.id}`}>{t("view")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/affiliates?status=${status}&page=${page - 1}`}>
                {t("previous")}
              </Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/affiliates?status=${status}&page=${page + 1}`}>
                {t("next")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
