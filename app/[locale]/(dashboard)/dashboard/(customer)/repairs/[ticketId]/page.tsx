import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { getRepairTicket } from "@/actions/repair.actions"
import { formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await params
  const t = await getTranslations("repairs")
  return { title: `${t("ticket")} — ${ticketId.slice(-8).toUpperCase()}` }
}

export default async function RepairTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await params
  const t = await getTranslations("repairs")
  const locale = (await getLocale()) as "en" | "fr"

  const ticket = await getRepairTicket(ticketId)
  if (!ticket) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {t("ticket")} #{ticket.id.slice(-8).toUpperCase()}
        </h1>
        <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>
          {t(`status_${ticket.status}`)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("requestDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("type")}</span>
              <Badge variant="outline">{t(`type_${ticket.requestType}`)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("priority")}</span>
              <span>{t(`priority_${ticket.priority}`)}</span>
            </div>
            {ticket.product && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("product")}</span>
                <span>{ticket.product.name}</span>
              </div>
            )}
            {ticket.guaranteeCard && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("guaranteeCard")}</span>
                <span className="font-mono text-xs">
                  {ticket.guaranteeCard.serialNumber}
                </span>
              </div>
            )}
            {ticket.assignee && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("assignedTo")}</span>
                <span>{ticket.assignee.name}</span>
              </div>
            )}
            {ticket.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("branch")}</span>
                <span>{ticket.branch.name}</span>
              </div>
            )}
            <Separator />
            <div>
              <p className="mb-1 text-muted-foreground">{t("issueDescription")}</p>
              <p className="whitespace-pre-wrap">{ticket.issueDescription}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status History */}
        <Card>
          <CardHeader>
            <CardTitle>{t("statusHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.statusHistory.map((entry) => (
                <div key={entry.id} className="border-l-2 pl-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={STATUS_VARIANT[entry.status] ?? "outline"}
                      className="text-xs"
                    >
                      {t(`status_${entry.status}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt, locale)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                  {entry.changedByUser && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      — {entry.changedByUser.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attachments */}
      {ticket.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("attachments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ticket.attachments.map((att) => (
                <li key={att.id} className="flex items-center gap-2 text-sm">
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {att.fileName}
                  </a>
                  <span className="text-muted-foreground">
                    ({(att.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
