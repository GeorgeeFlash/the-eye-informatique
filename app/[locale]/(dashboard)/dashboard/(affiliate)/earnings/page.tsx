import { getTranslations } from "next-intl/server"
import { getAffiliateEarnings } from "@/actions/affiliate.actions"
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
import { DollarSignIcon, MousePointerClickIcon, TrendingUpIcon, WalletIcon } from "lucide-react"
import { PayoutButton } from "./payout-button"

export default async function AffiliateEarningsPage() {
  const t = await getTranslations("affiliate")
  const data = await getAffiliateEarnings()
  if (!data) return null

  const { profile, pendingBalance, totalEarned, totalPaid, referralCount, totalClicks } = data

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("earnings")}</h1>
        {pendingBalance > 0 && <PayoutButton />}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalEarned")}</CardTitle>
            <TrendingUpIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarned)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingBalance")}</CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingBalance)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalPaid")}</CardTitle>
            <DollarSignIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("referrals")}</CardTitle>
            <MousePointerClickIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalClicks} {t("clicks")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("commissionRate")}</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold">
            {(profile.commissionRate.toNumber() * 100).toFixed(0)}%
          </span>
        </CardContent>
      </Card>

      {/* Recent referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("recentReferrals")}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noReferrals")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("link")}</TableHead>
                  <TableHead>{t("commission")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-mono text-sm">{ref.link.code}</TableCell>
                    <TableCell>{formatCurrency(ref.commission.toNumber())}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ref.status === "PAID"
                            ? "default"
                            : ref.status === "CONFIRMED"
                              ? "secondary"
                              : "outline"
                        }
                      >
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
    </div>
  )
}
