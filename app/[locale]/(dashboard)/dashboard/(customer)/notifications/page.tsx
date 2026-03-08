import { getTranslations } from "next-intl/server"
import { getNotifications } from "@/actions/notification.actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BellIcon } from "lucide-react"
import { NotificationList } from "./notification-list"

export async function generateMetadata() {
  const t = await getTranslations("notifications")
  return { title: t("title") }
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const t = await getTranslations("notifications")
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const { notifications, total, totalPages } = await getNotifications({
    page,
    pageSize: 20,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellIcon className="size-5" />
              <CardTitle>{t("allNotifications")}</CardTitle>
            </div>
            <CardDescription>
              {t("totalCount", { count: total })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationList
            notifications={notifications}
            page={page}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  )
}
