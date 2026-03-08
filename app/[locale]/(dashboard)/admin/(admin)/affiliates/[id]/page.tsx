import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getAdminAffiliateDetail } from "@/actions/affiliate.actions"
import { formatCurrency, formatDate } from "@/lib/utils"
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
import { Badge } from "@/components/ui/badge"
import { AffiliateAdminActions } from "./admin-actions"

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("affiliate")
  const profile = await getAdminAffiliateDetail(id)
  if (!profile) notFound()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.user.name}
          </h1>
          <p className="text-muted-foreground">{profile.user.email}</p>
        </div>
        <Badge
          variant={
            profile.status === "APPROVED"
              ? "default"
              : profile.status === "PENDING"
                ? "secondary"
                : "destructive"
          }
        >
          {t(`affiliateStatus.${profile.status}`)}
        </Badge>
      </div>

      <AffiliateAdminActions profileId={profile.id} status={profile.status} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalEarned")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profile.totalEarned.toNumber())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalPaid")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profile.totalPaid.toNumber())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("commissionRate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(profile.commissionRate.toNumber() * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("links")} ({profile.links.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLinks")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("targetUrl")}</TableHead>
                  <TableHead>{t("clicks")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono text-sm">{link.code}</TableCell>
                    <TableCell className="max-w-50 truncate text-sm">
                      {link.targetUrl}
                    </TableCell>
                    <TableCell>{link.clickCount}</TableCell>
                    <TableCell>{formatDate(link.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("referrals")} ({profile.referrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noReferrals")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("link")}</TableHead>
                  <TableHead>{t("orderTotal")}</TableHead>
                  <TableHead>{t("commission")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-mono text-sm">{ref.link.code}</TableCell>
                    <TableCell>
                      {ref.order ? formatCurrency(ref.order.total.toNumber()) : "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(ref.commission.toNumber())}</TableCell>
                    <TableCell>
                      <Badge variant={ref.status === "PAID" ? "default" : "secondary"}>
                        {ref.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(ref.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("payouts")} ({profile.payouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPayouts")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("requested")}</TableHead>
                  <TableHead>{t("processed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">
                      {formatCurrency(payout.amount.toNumber())}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payout.status === "COMPLETED"
                            ? "default"
                            : payout.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(payout.createdAt)}</TableCell>
                    <TableCell>
                      {payout.processedAt ? formatDate(payout.processedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
