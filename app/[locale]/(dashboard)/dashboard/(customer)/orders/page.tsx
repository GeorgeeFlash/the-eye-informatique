import { getLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getCustomerOrders } from "@/actions/order.actions"
import { formatCurrency, formatDate } from "@/lib/utils"
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
import { PackageIcon } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("orders")
  return { title: t("title") }
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
}

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const t = await getTranslations("orders")
  const locale = (await getLocale()) as "en" | "fr"

  const { orders, totalPages } = await getCustomerOrders(page, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <PackageIcon className="size-12 text-muted-foreground" />
            <CardTitle>{t("noOrders")}</CardTitle>
            <CardDescription>{t("noOrdersDescription")}</CardDescription>
            <Button asChild>
              <Link href="/products">{t("startShopping")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {t("title")} ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orderNumber")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("items")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.createdAt, "dd/MM/yyyy", locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANT[order.status] ?? "outline"
                          }
                        >
                          {t(`status_${order.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order._count?.items ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(order.total), locale)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/orders/${order.id}`}>
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

          {/* Pagination */}
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
