import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getArticleBySlug } from "@/actions/blog.actions"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postSlug: string }>
}): Promise<Metadata> {
  const { postSlug } = await params
  const article = await getArticleBySlug(postSlug)
  if (!article) return { title: "Not Found" }
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.coverImageUrl ? [article.coverImageUrl] : [],
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ postSlug: string; locale: string }>
}) {
  const { postSlug, locale } = await params
  const t = await getTranslations("blog")
  const article = await getArticleBySlug(postSlug)

  if (!article) notFound()

  // Simple JSON content renderer — works for plain text and basic BlockNote output
  const contentHtml =
    typeof article.content === "string"
      ? article.content
      : JSON.stringify(article.content)

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/${locale}/blog`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {t("backToBlog")}
      </Link>

      {article.coverImageUrl && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {article.author?.name && <span>{article.author.name}</span>}
          {article.publishedAt && (
            <>
              <span>·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
            </>
          )}
          <span>·</span>
          <span>{t("views", { count: article.viewCount })}</span>
        </div>
        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link key={tag.id} href={`/${locale}/blog?tag=${tag.slug}`}>
                <Badge variant="secondary">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {/* 
          For a full BlockNote implementation, render blocks here. 
          For now we display the raw content. 
        */}
        <div
          dangerouslySetInnerHTML={{
            __html:
              typeof article.content === "string"
                ? article.content
                : renderBlockContent(article.content),
          }}
        />
      </div>
    </article>
  )
}

/**
 * Minimal renderer for BlockNote JSON content.
 * Converts block-level nodes to simple HTML.
 */
function renderBlockContent(content: unknown): string {
  if (!Array.isArray(content)) return ""
  return content
    .map((block: { type?: string; content?: { text?: string }[]; props?: { level?: number } }) => {
      const text = block.content?.map((c) => c.text ?? "").join("") ?? ""
      switch (block.type) {
        case "heading": {
          const level = block.props?.level ?? 2
          return `<h${level}>${text}</h${level}>`
        }
        case "bulletListItem":
          return `<li>${text}</li>`
        case "numberedListItem":
          return `<li>${text}</li>`
        default:
          return text ? `<p>${text}</p>` : ""
      }
    })
    .join("\n")
}
