import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAdminArticle, getTags } from "@/actions/blog.actions";
import { getCurrentUser } from "@/lib/auth";
import { ArticleEditorWrapper } from "./article-editor-wrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") {
    const t = await getTranslations("blog");
    return { title: t("newArticle") };
  }
  const article = await getAdminArticle(id);
  return { title: article?.title ?? "Not Found" };
}

export default async function AdminBlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("blog");
  const tags = await getTags();
  const user = await getCurrentUser();
  const userRole = user?.role ?? "CUSTOMER";

  if (id === "new") {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("newArticle")}</h1>
        <ArticleEditorWrapper tags={tags} userRole={userRole} />
      </div>
    );
  }

  const article = await getAdminArticle(id);
  if (!article) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("editArticle")}</h1>
      <ArticleEditorWrapper article={article} tags={tags} userRole={userRole} />
    </div>
  );
}
