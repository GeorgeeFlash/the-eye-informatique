import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getOrder } from "@/actions/order.actions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { Locale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const t = await getTranslations("orders");
  const order = await getOrder(orderId);
  return {
    title: order ? `${t("order")} ${order.orderNumber}` : t("orderNotFound"),
  };
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
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const t = await getTranslations("orders");
  const locale = (await getLocale()) as Locale;

  const order = await getOrder(orderId);
  if (!order) notFound();

  const hasInstallments = order.installments && order.installments.length > 0;

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
            {formatDateTime(order.createdAt, locale)}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANT[order.status] ?? "outline"}
          className="ml-auto"
        >
          {t(`status_${order.status}`)}
        </Badge>
        {order.status === "DELIVERED" && (
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/guarantee-pdf/${order.id}?locale=${locale}`}
              download
            >
              <DownloadIcon className="mr-2 size-4" />
              {t("downloadGuarantee")}
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order items — AC-M3.2-12: per-item fulfillment status */}
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
                  <TableHead>{t("fulfillment")}</TableHead>
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
                      {formatCurrency(Number(item.unitPrice), locale)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.total), locale)}
                    </TableCell>
                    <TableCell>
                      {/* AC-M3.2-12: per-item fulfillment */}
                      <div className="space-y-1">
                        <Badge
                          variant={
                            item.fulfillmentStatus === "DELIVERED"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {t(`fulfillment_${item.fulfillmentStatus}`)}
                        </Badge>
                        {item.fulfillmentBranch && (
                          <p className="text-xs text-muted-foreground">
                            {t("shipsFrom", {
                              city: item.fulfillmentBranch.city,
                            })}
                          </p>
                        )}
                      </div>
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
                <span>{formatCurrency(Number(order.subtotal), locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span>{formatCurrency(Number(order.deliveryFee), locale)}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("tax")}</span>
                  <span>{formatCurrency(Number(order.tax), locale)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{t("total")}</span>
                <span>{formatCurrency(Number(order.total), locale)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment info — AC-M9.1-3: full receipt */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle>{t("payment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("method")}</span>
                  <span>{t(`paymentMethod_${order.payment.method}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("paymentStatus")}
                  </span>
                  <Badge
                    variant={
                      order.payment.status === "SUCCESS" ? "default" : "outline"
                    }
                  >
                    {t(`paymentStatus_${order.payment.status}`)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("amount")}</span>
                  <span>
                    {formatCurrency(Number(order.payment.amount), locale)}
                  </span>
                </div>
                {order.payment.payunitTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("transactionId")}
                    </span>
                    <span className="font-mono text-xs">
                      {order.payment.payunitTransactionId}
                    </span>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("paidAt")}</span>
                    <span>{formatDateTime(order.payment.paidAt, locale)}</span>
                  </div>
                )}
                {order.payment.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("receiptNumber")}
                    </span>
                    <span className="font-mono text-xs">
                      {order.payment.receiptNumber}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Installment info — AC-M3.2-8, CON-3.5 */}
          {hasInstallments && (
            <>
              {/* Balance summary card */}
              {(() => {
                const paid = order.installments
                  .filter((i) => i.status === "PAID")
                  .reduce((s, i) => s + Number(i.amount), 0);
                const outstanding = order.installments
                  .filter((i) => i.status !== "PAID")
                  .reduce((s, i) => s + Number(i.amount), 0);
                const nextDue = order.installments
                  .filter((i) => i.status !== "PAID")
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() -
                      new Date(b.dueDate).getTime(),
                  )[0];
                return (
                  <Card>
                    <CardContent className="grid grid-cols-3 gap-4 p-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("totalPaid")}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-green-600">
                          {formatCurrency(paid, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("outstandingBalance")}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-orange-600">
                          {formatCurrency(outstanding, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("nextPaymentDue")}
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          {nextDue
                            ? formatDate(nextDue.dueDate, "dd/MM/yyyy", locale)
                            : "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card>
                <CardHeader>
                  <CardTitle>{t("installments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{t("dueDate")}</TableHead>
                        <TableHead>{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.installments.map((inst) => {
                        const isPaid = inst.status === "PAID";
                        const isOverdue =
                          !isPaid && new Date(inst.dueDate) < new Date();
                        return (
                          <TableRow key={inst.id}>
                            <TableCell>{inst.sequenceNumber}</TableCell>
                            <TableCell>
                              {formatCurrency(Number(inst.amount), locale)}
                            </TableCell>
                            <TableCell>
                              {formatDate(inst.dueDate, "dd/MM/yyyy", locale)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  isPaid
                                    ? "default"
                                    : isOverdue
                                      ? "destructive"
                                      : "outline"
                                }
                              >
                                {isPaid
                                  ? t("installmentPaid")
                                  : isOverdue
                                    ? t("installmentOverdue")
                                    : t("installmentPending")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Outstanding balance */}
                  <div className="mt-4 flex justify-between border-t pt-3 text-sm font-medium">
                    <span>{t("outstandingBalance")}</span>
                    <span>
                      {formatCurrency(
                        order.installments
                          .filter((i) => i.status !== "PAID")
                          .reduce((sum, i) => sum + Number(i.amount), 0),
                        locale,
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Delivery info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("deliveryInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("deliveryMethod")}
                </span>
                <span>{t(`delivery_${order.deliveryMethod}`)}</span>
              </div>
              {order.address && (
                <div>
                  <span className="text-muted-foreground block mb-1">
                    {t("address")}
                  </span>
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
                          {formatDateTime(entry.createdAt, locale)}
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
  );
}
