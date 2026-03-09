"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleSchema,
  updateArticleSchema,
  type CreateArticleValues,
} from "@/lib/validators/blog.schema";
import {
  createArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
} from "@/actions/blog.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from "@/components/blog/editor";
import { toast } from "sonner";
import { SaveIcon, GlobeIcon, ArchiveIcon } from "lucide-react";
import { Locale } from "@/lib/constants";

type Tag = { id: string; name: string; slug: string };

type Article = {
  id: string;
  title: string;
  slug: string;
  content: unknown;
  excerpt: string | null;
  coverImageUrl: string | null;
  locale: string;
  status: string;
  tags: Tag[];
};

export function ArticleEditor({
  article,
  tags,
}: {
  article?: Article;
  tags: Tag[];
}) {
  const t = useTranslations("blog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState<unknown>(article?.content ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    article?.tags.map((t) => t.id) ?? [],
  );

  const isNew = !article;

  const form = useForm<CreateArticleValues>({
    resolver: zodResolver(
      isNew ? createArticleSchema : updateArticleSchema,
    ) as never,
    defaultValues: {
      title: article?.title ?? "",
      slug: article?.slug ?? "",
      excerpt: article?.excerpt ?? "",
      coverImageUrl: article?.coverImageUrl ?? "",
      locale: (article?.locale as Locale) ?? "en",
    },
  });

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200);
  }

  function onSubmit(values: CreateArticleValues) {
    startTransition(async () => {
      const data = { ...values, content, tagIds: selectedTagIds };

      if (isNew) {
        const result = await createArticle(data);
        if (!("success" in result)) {
          toast.error(t("saveError"));
          return;
        }
        toast.success(t("articleCreated"));
        router.push(`/admin/blog/${result.articleId}`);
      } else {
        const result = await updateArticle(article.id, data);
        if (!("success" in result)) {
          toast.error(t("saveError"));
          return;
        }
        toast.success(t("articleSaved"));
        router.refresh();
      }
    });
  }

  function handlePublish() {
    if (!article) return;
    startTransition(async () => {
      await publishArticle(article.id);
      toast.success(t("articlePublished"));
      router.refresh();
    });
  }

  function handleUnpublish() {
    if (!article) return;
    startTransition(async () => {
      await unpublishArticle(article.id);
      toast.success(t("articleUnpublished"));
      router.refresh();
    });
  }

  function handleDelete() {
    if (!article) return;
    startTransition(async () => {
      await deleteArticle(article.id);
      toast.success(t("articleDeleted"));
      router.push("/admin/blog");
    });
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* Main editor */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input
                id="title"
                {...form.register("title", {
                  onChange: (e) => {
                    if (
                      isNew ||
                      form.getValues("slug") ===
                        generateSlug(article?.title ?? "")
                    ) {
                      form.setValue("slug", generateSlug(e.target.value));
                    }
                  },
                })}
                placeholder={t("titlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input id="slug" {...form.register("slug")} />
            </div>

            <div className="space-y-2">
              <Label>{t("content")}</Label>
              <Editor initialContent={content} onChange={setContent} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">{t("excerpt")}</Label>
              <Textarea
                id="excerpt"
                {...form.register("excerpt")}
                placeholder={t("excerptPlaceholder")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar settings */}
      <div className="space-y-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("actions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {article && (
              <div className="mb-4">
                <Badge
                  variant={
                    article.status === "PUBLISHED" ? "default" : "secondary"
                  }
                >
                  {t(`status.${article.status}`)}
                </Badge>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              <SaveIcon className="mr-2 size-4" />
              {isNew ? t("createDraft") : t("saveDraft")}
            </Button>

            {article && article.status === "DRAFT" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handlePublish}
                disabled={isPending}
              >
                <GlobeIcon className="mr-2 size-4" />
                {t("publish")}
              </Button>
            )}

            {article && article.status === "PUBLISHED" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleUnpublish}
                disabled={isPending}
              >
                {t("unpublish")}
              </Button>
            )}

            {article && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={isPending}
              >
                <ArchiveIcon className="mr-2 size-4" />
                {t("archive")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cover image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("coverImage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              {...form.register("coverImageUrl")}
              placeholder="https://..."
            />
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              defaultValue={form.getValues("locale")}
              onValueChange={(v) => form.setValue("locale", v as Locale)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("tags")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={
                    selectedTagIds.includes(tag.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("noTags")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
