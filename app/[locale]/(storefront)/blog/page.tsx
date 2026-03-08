import { getTranslations } from "next-intl/server"
import { getPublishedArticles, getTags } from "@/actions/blog.actions"
import { ArticleCard } from "@/components/blog/article-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"

export async function generateMetadata() {
  const t = await getTranslations("blog")
  return { title: t("title"), description: t("description") }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>
}) {
  const { locale } = await params
  const { page: pageParam, tag, q } = await searchParams
  const t = await getTranslations("blog")
  const page = Math.max(1, Number(pageParam) || 1)

  const [{ articles, total, totalPages }, tags] = await Promise.all([
    getPublishedArticles({ page, pageSize: 10, tag, search: q, locale }),
    getTags(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <form className="relative flex-1" action={`/${locale}/blog`}>
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder={t("searchPlaceholder")}
            defaultValue={q}
            className="pl-9"
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
        </form>

        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/blog`}>
            <Badge variant={!tag ? "default" : "outline"}>{t("allPosts")}</Badge>
          </Link>
          {tags.map((t) => (
            <Link key={t.id} href={`/${locale}/blog?tag=${t.slug}`}>
              <Badge variant={tag === t.slug ? "default" : "outline"}>
                {t.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              title={article.title}
              slug={article.slug}
              excerpt={article.excerpt}
              coverImageUrl={article.coverImageUrl}
              publishedAt={article.publishedAt}
              authorName={article.author?.name}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            <Link
              href={`/${locale}/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}${q ? `&q=${q}` : ""}`}
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
            <Link
              href={`/${locale}/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}${q ? `&q=${q}` : ""}`}
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
