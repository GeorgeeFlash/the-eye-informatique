import { Link } from "@/i18n/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { requireRole } from "@/lib/auth"
import { getOrders } from "@/actions/order.actions"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { Locale } from "@/lib/constants"

export async function generateMetadata() {
  const t = await getTranslations("adminOrders")
  return { title: t("title") }
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

const PAYMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  SUCCESS: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"])
  const { page: pageParam, status } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const t = await getTranslations("adminOrders")
  const tOrders = await getTranslations("orders")
  const locale = await getLocale() as Locale

  const branchId =
    user.role === "CENTRAL_ADMIN" ? undefined : user.branchId ?? undefined

  const { orders, totalPages, total } = await getOrders({
    status: status as Parameters<typeof getOrders>[0] extends { status?: infer S } ? S : never,
    branchId,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("totalOrders", { count: total })}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
          (s) => (
            <Button
              key={s}
              asChild
              variant={status === s || (!status && s === "") ? "default" : "outline"}
              size="sm"
            >
              <Link href={s ? `?status=${s}` : "?"}>
                {s ? tOrders(`status_${s}`) : t("all")}
              </Link>
            </Button>
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tOrders("orderNumber")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{tOrders("status")}</TableHead>
                <TableHead>{t("paymentMethod")}</TableHead>
                <TableHead>{tOrders("items")}</TableHead>
                <TableHead>{tOrders("total")}</TableHead>
                <TableHead>{tOrders("date")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {tOrders("noOrders")}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {(order as { user?: { name?: string | null; email?: string | null } }).user?.name ??
                        (order as { user?: { name?: string | null; email?: string | null } }).user?.email ??
                        "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                        {tOrders(`status_${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.payment ? (
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={PAYMENT_VARIANT[order.payment.status] ?? "outline"}
                            className="text-xs"
                          >
                            {tOrders(`paymentStatus_${order.payment.status}`)}
                          </Badge>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {t("itemCount", { count: order._count.items })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(order.total), locale)}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt, "dd/MM/yyyy", locale)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>
                          {t("manage")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
                {tOrders("previous")}
              </Link>
            </Button>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {tOrders("pageOf", { page, totalPages })}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}
              >
                {tOrders("next")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
