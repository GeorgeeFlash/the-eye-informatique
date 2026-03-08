// Blog article page (M6.1)
export default function BlogArticlePage({
  params,
}: {
  params: Promise<{ postSlug: string }>
}) {
  void params
  return (
    <div>
      {/* TODO: Article content rendered from BlockNote JSON */}
    </div>
  )
}
