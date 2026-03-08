import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getOrder } from "@/actions/order.actions"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeftIcon } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const t = await getTranslations("orders")
  const order = await getOrder(orderId)
  return {
    title: order ? `${t("order")} ${order.orderNumber}` : t("orderNotFound"),
  }
}

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const t = await getTranslations("orders")

  const order = await getOrder(orderId)
  if (!order) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/orders">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {t("order")} {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANT[order.status] ?? "outline"}
          className="ml-auto"
        >
          {t(`status_${order.status}`)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("items")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-center">{t("qty")}</TableHead>
                  <TableHead className="text-right">{t("unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("lineTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.variant?.product?.name ?? "-"}
                      </div>
                      {item.variant?.color && (
                        <span className="text-xs text-muted-foreground">
                          {item.variant.color}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span>{formatCurrency(Number(order.tax))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{t("total")}</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment info */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle>{t("payment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("method")}</span>
                  <span>{order.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentStatus")}</span>
                  <Badge variant={order.payment.status === "SUCCESS" ? "default" : "outline"}>
                    {order.payment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("deliveryInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("deliveryMethod")}</span>
                <span>{t(`delivery_${order.deliveryMethod}`)}</span>
              </div>
              {order.address && (
                <div>
                  <span className="text-muted-foreground block mb-1">{t("address")}</span>
                  <span>
                    {order.address.street}, {order.address.city},{" "}
                    {order.address.region}
                  </span>
                </div>
              )}
              {order.branch && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("branch")}</span>
                  <span>{order.branch.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("history")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.statusHistory.map((entry) => (
                    <div key={entry.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {t(`status_${entry.status}`)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-muted-foreground">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
