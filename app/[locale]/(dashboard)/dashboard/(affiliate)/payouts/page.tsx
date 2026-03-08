import { getTranslations } from "next-intl/server"
import { getMyAffiliateProfile } from "@/actions/affiliate.actions"
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

export default async function AffiliatePayoutsPage() {
  const t = await getTranslations("affiliate")
  const profile = await getMyAffiliateProfile()
  if (!profile) return null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("payoutHistory")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payoutMethod")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {profile.payoutMethod} — {profile.payoutPhone ?? t("noPayoutPhone")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payouts")}</CardTitle>
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
