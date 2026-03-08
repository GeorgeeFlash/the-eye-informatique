import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { getRepairTicket } from "@/actions/repair.actions"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AdminRepairActions } from "./repair-actions"

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
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("repairs")
  return { title: `${t("ticket")} — ${id.slice(-8).toUpperCase()}` }
}

export default async function AdminRepairTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const { id } = await params
  const t = await getTranslations("repairs")

  const ticket = await getRepairTicket(id)
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("requestDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">{t("customer")}</span>
                <p className="font-medium">{ticket.user?.name ?? "-"}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.user?.email}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("type")}</span>
                <p>
                  <Badge variant="outline">
                    {t(`type_${ticket.requestType}`)}
                  </Badge>
                </p>
              </div>
              {ticket.product && (
                <div>
                  <span className="text-muted-foreground">{t("product")}</span>
                  <p className="font-medium">{ticket.product.name}</p>
                </div>
              )}
              {ticket.guaranteeCard && (
                <div>
                  <span className="text-muted-foreground">
                    {t("guaranteeCard")}
                  </span>
                  <p className="font-mono text-xs">
                    {ticket.guaranteeCard.serialNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires:{" "}
                    {new Date(
                      ticket.guaranteeCard.expiresAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              {ticket.branch && (
                <div>
                  <span className="text-muted-foreground">{t("branch")}</span>
                  <p>{ticket.branch.name} — {ticket.branch.city}</p>
                </div>
              )}
              {ticket.assignee && (
                <div>
                  <span className="text-muted-foreground">
                    {t("assignedTo")}
                  </span>
                  <p>{ticket.assignee.name}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="mb-1 text-muted-foreground">
                {t("issueDescription")}
              </p>
              <p className="whitespace-pre-wrap">{ticket.issueDescription}</p>
            </div>

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-muted-foreground">
                    {t("attachments")}
                  </p>
                  <ul className="space-y-1">
                    {ticket.attachments.map((att) => (
                      <li key={att.id}>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {att.fileName}
                        </a>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions panel */}
        <div className="space-y-6">
          <AdminRepairActions
            ticketId={ticket.id}
            currentStatus={ticket.status}
          />

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
                        {new Date(entry.createdAt).toLocaleString()}
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
      </div>
    </div>
  )
}
