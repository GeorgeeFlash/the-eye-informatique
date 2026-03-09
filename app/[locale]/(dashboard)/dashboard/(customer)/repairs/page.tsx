import { Link } from "@/i18n/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { getRepairTickets } from "@/actions/repair.actions"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { WrenchIcon, PlusIcon } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("repairs")
  return { title: t("title") }
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

export default async function CustomerRepairsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const t = await getTranslations("repairs")
  const locale = (await getLocale()) as "en" | "fr"

  const { tickets, totalPages } = await getRepairTickets({ page, pageSize: 10 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/repairs/new">
            <PlusIcon className="mr-2 size-4" />
            {t("newRequest")}
          </Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <WrenchIcon className="size-12 text-muted-foreground" />
            <CardTitle>{t("noTickets")}</CardTitle>
            <CardDescription>{t("noTicketsDescription")}</CardDescription>
            <Button asChild>
              <Link href="/dashboard/repairs/new">
                <PlusIcon className="mr-2 size-4" />
                {t("newRequest")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {t("title")} ({tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ticketId")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("product")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
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
                      <TableCell>
                        <Badge variant="outline">
                          {t(`type_${ticket.requestType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.product?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>
                          {t(`status_${ticket.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(ticket.createdAt, "dd/MM/yyyy", locale)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/repairs/${ticket.id}`}>
                            {t("viewDetails")}
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
                  <Link href={`?page=${page - 1}`}>{t("previous")}</Link>
                </Button>
              )}
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {t("pageOf", { page, totalPages })}
              </span>
              {page < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`?page=${page + 1}`}>{t("next")}</Link>
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
