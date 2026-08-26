"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categorySchema,
  type CategoryFormValues,
} from "@/lib/validators/category.schema";
import { createCategory, deleteCategory } from "@/actions/category.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Loader2Icon,
  FolderIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/utils";
import { ImagePicker } from "@/components/media/image-picker";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  _count: { products: number };
};

interface Props {
  categories: CategoryRow[];
}

export function CategoryListClient({ categories }: Props) {
  const t = useTranslations("categoryAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues: {
      name: "",
      slug: "",
      sortOrder: 0,
    },
  });

  async function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const result = await createCategory(values);
      if ("error" in result && result.error) return;
      setDialogOpen(false);
      form.reset();
      router.refresh();
    });
  }

  const handleNameBlur = useCallback(() => {
    if (!form.getValues("slug")) {
      form.setValue("slug", slugify(form.getValues("name") || ""));
    }
  }, [form]);

  const handleRegenerateSlug = useCallback(() => {
    form.setValue("slug", slugify(form.getValues("name") || ""));
  }, [form]);

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteCategory(id);
      router.refresh();
    });
  }

  // Group categories: top-level first, then children
  const topLevel = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, CategoryRow[]>();
  for (const c of categories) {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) ?? [];
      arr.push(c);
      childrenMap.set(c.parentId, arr);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t("addCategory")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("newCategory")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} onBlur={handleNameBlur} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("slug")}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} className="flex-1" />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            title={t("regenerateSlug")}
                            onClick={handleRegenerateSlug}
                          >
                            <RefreshCwIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>{t("slugHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("parentCategory")}</FormLabel>
                      <Select
                        onValueChange={(v) =>
                          field.onChange(v === "none" ? null : v)
                        }
                        defaultValue={field.value ?? "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t("none")}</SelectItem>
                          {topLevel.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sortOrder")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>{t("sortOrderHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("iconUrl")}</FormLabel>
                      <FormControl>
                        <ImagePicker
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>{t("iconUrlHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("create")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {t("noCategories")}
        </p>
      )}

      <div className="grid gap-3">
        {topLevel.map((cat) => {
          const children = childrenMap.get(cat.id) ?? [];
          return (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /{cat.slug} ·{" "}
                      {t("products", { count: cat._count.products })}
                    </p>
                    {children.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {children.map((child) => (
                          <Badge
                            key={child.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {child.name} ({child._count.products})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/admin/categories/${cat.id}`}>
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
