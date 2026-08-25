"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categorySchema,
  featureFieldSchema,
  type CategoryFormValues,
  type FeatureFieldFormValues,
} from "@/lib/validators/category.schema";
import {
  updateCategory,
  createFeatureField,
  updateFeatureField,
  deleteFeatureField,
} from "@/actions/category.actions";
import { slugify } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiInput } from "@/components/ui/multi-input";
import { Switch } from "@/components/ui/switch";
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
import { PlusIcon, TrashIcon, PencilIcon, Loader2Icon } from "lucide-react";

type FeatureFieldRow = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  options: unknown;
  sortOrder: number;
  isRequired: boolean;
};

interface Props {
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    iconUrl: string | null;
    sortOrder: number;
  };
  featureFields: FeatureFieldRow[];
  parentOptions: { id: string; name: string }[];
}

export function CategoryEditClient({
  category,
  featureFields,
  parentOptions,
}: Props) {
  const t = useTranslations("categoryAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FeatureFieldRow | null>(
    null,
  );

  // Category form
  const catForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues: {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      iconUrl: category.iconUrl ?? undefined,
      sortOrder: category.sortOrder,
    },
  });

  async function onCategorySubmit(values: CategoryFormValues) {
    startTransition(async () => {
      const slug = values.slug || slugify(values.name);
      const result = await updateCategory(category.id, { ...values, slug });
      if ("error" in result && result.error) return;
      router.refresh();
    });
  }

  // Feature field form
  const fieldForm = useForm<FeatureFieldFormValues>({
    resolver: zodResolver(featureFieldSchema) as never,
    defaultValues: {
      name: "",
      type: "TEXT",
      sortOrder: 0,
      isRequired: false,
      options: [],
    },
  });

  const watchFieldType = useWatch({ control: fieldForm.control, name: "type" });

  function openNewField() {
    setEditingField(null);
    fieldForm.reset({
      name: "",
      type: "TEXT",
      sortOrder: 0,
      isRequired: false,
      options: [],
    });
    setFieldDialogOpen(true);
  }

  function openEditField(field: FeatureFieldRow) {
    setEditingField(field);
    const opts = Array.isArray(field.options)
      ? (field.options as string[])
      : [];
    fieldForm.reset({
      name: field.name,
      type: field.type,
      sortOrder: field.sortOrder,
      isRequired: field.isRequired,
      options: opts,
    });
    setFieldDialogOpen(true);
  }

  async function onFieldSubmit(values: FeatureFieldFormValues) {
    startTransition(async () => {
      if (editingField) {
        await updateFeatureField(editingField.id, values);
      } else {
        await createFeatureField(category.id, values);
      }
      setFieldDialogOpen(false);
      fieldForm.reset();
      router.refresh();
    });
  }

  async function handleDeleteField(id: string) {
    if (!confirm(t("confirmDeleteField"))) return;
    startTransition(async () => {
      await deleteFeatureField(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("editCategory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...catForm}>
            <form
              onSubmit={catForm.handleSubmit(onCategorySubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={catForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={catForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("slug")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={catForm.control}
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
                          {parentOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={catForm.control}
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
              </div>

              <FormField
                control={catForm.control}
                name="iconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("iconUrl")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
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
                  onClick={() => router.push("/admin/categories")}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Feature Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("featureFields")}</CardTitle>
            <CardDescription>{t("featureFieldsHint")}</CardDescription>
          </div>
          <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={openNewField}>
                <PlusIcon className="mr-1 h-4 w-4" />
                {t("addField")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingField ? t("fieldName") : t("addField")}
                </DialogTitle>
              </DialogHeader>
              <Form {...fieldForm}>
                <form
                  onSubmit={fieldForm.handleSubmit(onFieldSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={fieldForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fieldName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={fieldForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("fieldType")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TEXT">
                                {t("fieldTypeText")}
                              </SelectItem>
                              <SelectItem value="NUMBER">
                                {t("fieldTypeNumber")}
                              </SelectItem>
                              <SelectItem value="DROPDOWN">
                                {t("fieldTypeDropdown")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={fieldForm.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sortOrder")}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchFieldType === "DROPDOWN" && (
                    <FormField
                      control={fieldForm.control}
                      name="options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("fieldOptions")}</FormLabel>
                          <FormControl>
                            <MultiInput
                              value={field.value ?? []}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("fieldOptionsHint")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={fieldForm.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t("fieldRequired")}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFieldDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingField ? t("save") : t("create")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {featureFields.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t("noFeatureFields")}
            </p>
          ) : (
            <div className="space-y-2">
              {featureFields.map((ff) => (
                <div
                  key={ff.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{ff.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {ff.type === "TEXT"
                            ? t("fieldTypeText")
                            : ff.type === "NUMBER"
                              ? t("fieldTypeNumber")
                              : t("fieldTypeDropdown")}
                        </Badge>
                        {ff.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            {t("fieldRequired")}
                          </Badge>
                        )}
                        {ff.type === "DROPDOWN" &&
                          Array.isArray(ff.options) && (
                            <span className="text-xs text-muted-foreground">
                              {(ff.options as string[]).join(", ")}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditField(ff)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteField(ff.id)}
                      disabled={isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
