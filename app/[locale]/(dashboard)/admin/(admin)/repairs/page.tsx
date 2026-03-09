import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { getRepairTickets } from "@/actions/repair.actions"
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

export async function generateMetadata() {
  const t = await getTranslations("repairs")
  return { title: t("adminTitle") }
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  SUBMITTED: "outline",
  DIAGNOSED: "secondary",
  IN_REPAIR: "secondary",
  READY: "default",
  RETURNED: "default",
  CLOSED: "destructive",
}

const PRIORITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  URGENT: "destructive",
}

export default async function AdminRepairsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const { page: pageParam, status } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const t = await getTranslations("repairs")

  const { tickets, totalPages, total } = await getRepairTickets({
    status: status as Parameters<typeof getRepairTickets>[0] extends { status?: infer S } ? S : never,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminTitle")}</h1>
        <p className="text-muted-foreground">
          {t("totalTickets", { count: total })}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["", "SUBMITTED", "DIAGNOSED", "IN_REPAIR", "READY", "RETURNED", "CLOSED"].map(
          (s) => (
            <Button
              key={s}
              asChild
              variant={status === s || (!status && s === "") ? "default" : "outline"}
              size="sm"
            >
              <Link href={s ? `?status=${s}` : "?"}>
                {s ? t(`status_${s}`) : t("all")}
              </Link>
            </Button>
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tickets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ticketId")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("assignedTo")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">
                    {ticket.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>{ticket.user?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`type_${ticket.requestType}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.product?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? "outline"}>
                      {t(`priority_${ticket.priority}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>
                      {t(`status_${ticket.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.assignee?.name ?? "-"}</TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/repairs/${ticket.id}`}>
                        {t("manage")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}
              >
                {t("previous")}
              </Link>
            </Button>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {t("pageOf", { page, totalPages })}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}
              >
                {t("next")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
