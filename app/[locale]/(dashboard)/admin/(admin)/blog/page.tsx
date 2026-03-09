import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { getAdminArticles } from "@/actions/blog.actions"
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
import { PlusIcon, FileTextIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"

export async function generateMetadata() {
  const t = await getTranslations("blog")
  return { title: t("adminTitle") }
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const t = await getTranslations("blog")
  const { page: pageParam, status } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const validStatus = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status ?? "")
    ? (status as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : undefined

  const { articles, total, totalPages } = await getAdminArticles({
    page,
    status: validStatus,
  })

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("adminTitle")}</h1>
          <p className="text-muted-foreground">{t("adminDescription")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusIcon className="mr-2 size-4" />
            {t("newArticle")}
          </Link>
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {[undefined, "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
          <Button
            key={s ?? "all"}
            variant={validStatus === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/admin/blog${s ? `?status=${s}` : ""}`}>
              {s ? t(`status.${s}`) : t("allPosts")}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-5" />
            <CardTitle>{t("articles")}</CardTitle>
          </div>
          <CardDescription>
            {t("totalArticles", { count: total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noArticles")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("titleLabel")}</TableHead>
                  <TableHead>{t("author")}</TableHead>
                  <TableHead>{t("statusLabel")}</TableHead>
                  <TableHead>{t("views")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Link
                        href={`/admin/blog/${article.id}`}
                        className="font-medium hover:underline"
                      >
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.author?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[article.status] ?? "outline"}>
                        {t(`status.${article.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.viewCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(article.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link
                  href={`/admin/blog?page=${page - 1}${validStatus ? `&status=${validStatus}` : ""}`}
                >
                  ←
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                <Link
                  href={`/admin/blog?page=${page + 1}${validStatus ? `&status=${validStatus}` : ""}`}
                >
                  →
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
