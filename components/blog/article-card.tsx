import Link from "next/link"
import Image from "next/image"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ArticleCardProps {
  title: string
  slug: string
  excerpt?: string | null
  coverImageUrl?: string | null
  publishedAt?: Date | null
  authorName?: string | null
  locale: string
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  coverImageUrl,
  publishedAt,
  authorName,
  locale,
}: ArticleCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/${locale}/blog/${slug}`}>
        <div className="relative aspect-video bg-muted">
          {coverImageUrl && (
            <Image src={coverImageUrl} alt={title} fill className="object-cover" />
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/${locale}/blog/${slug}`}>
          <h3 className="line-clamp-2 font-semibold">{title}</h3>
        </Link>
        {excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2 p-4 pt-0 text-xs text-muted-foreground">
        {authorName && <Badge variant="secondary">{authorName}</Badge>}
        {publishedAt && <span>{formatDate(publishedAt)}</span>}
      </CardFooter>
    </Card>
  )
}
