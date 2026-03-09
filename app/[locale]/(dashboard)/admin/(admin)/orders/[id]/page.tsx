import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { getOrder } from "@/actions/order.actions"
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
import { Separator } from "@/components/ui/separator"
import { ArrowLeftIcon } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AdminOrderActions } from "./order-actions"
import { Locale } from "@/lib/constants"

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
}

const PAYMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  SUCCESS: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
}

const FULFILLMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  SHIPPED: "secondary",
  DELIVERED: "default",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrder(id)
  const t = await getTranslations("adminOrders")
  return {
    title: order
      ? `${t("orderDetails")} — #${order.orderNumber}`
      : t("orderDetails"),
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const { id } = await params
  const t = await getTranslations("adminOrders")
  const tOrders = await getTranslations("orders")
  const locale = await getLocale() as Locale

  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/orders">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {tOrders("orderNumber")}
            {order.orderNumber}
          </h1>
          <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
            {tOrders(`status_${order.status}`)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("customerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">{t("customer")}</span>
                  <p className="font-medium">
                    {(order as { user?: { name?: string | null } }).user?.name ?? "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("email")}</span>
                  <p>
                    {(order as { user?: { email?: string | null } }).user?.email ?? "-"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{tOrders("date")}</span>
                  <p>{formatDate(order.createdAt, "dd/MM/yyyy HH:mm", locale)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{tOrders("deliveryMethod")}</span>
                  <p>{tOrders(`delivery_${order.deliveryMethod}`)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t("orderItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tOrders("product")}</TableHead>
                    <TableHead className="text-center">{tOrders("qty")}</TableHead>
                    <TableHead className="text-right">{tOrders("unitPrice")}</TableHead>
                    <TableHead className="text-right">{tOrders("lineTotal")}</TableHead>
                    <TableHead>{tOrders("fulfillment")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.variant.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.variant.sku}
                          </p>
                          {item.fulfillmentBranch && (
                            <p className="text-xs text-muted-foreground">
                              {tOrders("shipsFrom", { city: item.fulfillmentBranch.city })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.unitPrice), locale)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.total), locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={FULFILLMENT_VARIANT[item.fulfillmentStatus] ?? "outline"}
                          className="text-xs"
                        >
                          {tOrders(`fulfillment_${item.fulfillmentStatus}`)}
                        </Badge>
                        {item.guaranteeCard && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(item.guaranteeCard.expiresAt) > new Date()
                              ? tOrders("guaranteeActive")
                              : tOrders("guaranteeExpired")}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tOrders("subtotal")}</span>
                    <span>{formatCurrency(Number(order.subtotal), locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tOrders("tax")}</span>
                    <span>{formatCurrency(Number(order.tax), locale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tOrders("shipping")}</span>
                    <span>{formatCurrency(Number(order.deliveryFee), locale)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>{tOrders("total")}</span>
                    <span>{formatCurrency(Number(order.total), locale)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle>{t("paymentInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">{tOrders("paymentStatus")}</span>
                    <p>
                      <Badge variant={PAYMENT_VARIANT[order.payment.status] ?? "outline"}>
                        {tOrders(`paymentStatus_${order.payment.status}`)}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{tOrders("method")}</span>
                    <p>{tOrders(`paymentMethod_${order.payment.method}`)}</p>
                  </div>
                  {order.payment.receiptNumber && (
                    <div>
                      <span className="text-muted-foreground">{tOrders("receiptNumber")}</span>
                      <p className="font-mono text-xs">{order.payment.receiptNumber}</p>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div>
                      <span className="text-muted-foreground">{tOrders("paidAt")}</span>
                      <p>{formatDate(order.payment.paidAt, "dd/MM/yyyy HH:mm", locale)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Installments */}
          {order.installments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{tOrders("installments")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{tOrders("amount")}</TableHead>
                      <TableHead>{tOrders("dueDate")}</TableHead>
                      <TableHead>{tOrders("status")}</TableHead>
                      <TableHead>{tOrders("paidAt")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.installments.map((inst) => (
                      <TableRow key={inst.id}>
                        <TableCell>{inst.sequenceNumber}</TableCell>
                        <TableCell>{formatCurrency(Number(inst.amount), locale)}</TableCell>
                        <TableCell>{formatDate(inst.dueDate, "dd/MM/yyyy", locale)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inst.status === "PAID"
                                ? "default"
                                : inst.status === "OVERDUE"
                                  ? "destructive"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {tOrders(`installment${inst.status.charAt(0) + inst.status.slice(1).toLowerCase()}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inst.paidAt
                            ? formatDate(inst.paidAt, "dd/MM/yyyy", locale)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Delivery Details */}
          {(order.address || order.branch) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("deliveryInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">{tOrders("deliveryMethod")}</span>
                    <p>{tOrders(`delivery_${order.deliveryMethod}`)}</p>
                  </div>
                  {order.branch && (
                    <div>
                      <span className="text-muted-foreground">{tOrders("branch")}</span>
                      <p>{order.branch.name} — {order.branch.city}</p>
                    </div>
                  )}
                  {order.address && (
                    <div>
                      <span className="text-muted-foreground">{tOrders("address")}</span>
                      <p>{order.address.street}</p>
                      <p className="text-muted-foreground">
                        {order.address.city}, {order.address.region}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Actions + Status History */}
        <div className="space-y-6">
          <AdminOrderActions
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>{t("statusHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((entry) => (
                  <div key={entry.id} className="border-l-2 pl-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={STATUS_VARIANT[entry.status] ?? "outline"}
                        className="text-xs"
                      >
                        {tOrders(`status_${entry.status}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt, "dd/MM/yyyy HH:mm", locale)}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                    {entry.changedByUser && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("changedBy", { name: entry.changedByUser.name ?? "" })}
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
