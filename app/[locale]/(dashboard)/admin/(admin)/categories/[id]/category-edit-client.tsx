"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition, useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  createVariantAxis,
  updateVariantAxis,
  deleteVariantAxis,
  createAxisValue,
  updateAxisValue,
  deleteAxisValue,
  updateCategorySkuTemplate,
} from "@/actions/variant-axis.actions";
import { slugify } from "@/lib/utils";
import { generateSkuFromTemplate } from "@/lib/sku-generator";
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
import { ImagePicker } from "@/components/media/image-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeatureFieldRow = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  options: unknown;
  sortOrder: number;
  isRequired: boolean;
};

type VariantAxisRow = {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  values: {
    id: string;
    axisId: string;
    value: string;
    sortOrder: number;
    priceDelta: number | null;
  }[];
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
  variantAxes: VariantAxisRow[];
  skuTemplate: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryEditClient({
  category,
  featureFields,
  parentOptions,
  variantAxes: initialVariantAxes,
  skuTemplate: initialSkuTemplate,
}: Props) {
  const t = useTranslations("categoryAdmin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Feature field state
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FeatureFieldRow | null>(null);

  // Axis state
  const axes = initialVariantAxes
  const [axisDialogOpen, setAxisDialogOpen] = useState(false);
  const [editingAxis, setEditingAxis] = useState<VariantAxisRow | null>(null);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<{
    axisId: string;
    value: VariantAxisRow["values"][0] | null;
  } | null>(null);

  // SKU template state
  const [skuTemplate, setSkuTemplate] = useState(() => initialSkuTemplate ?? "")
  const [previewSlug, setPreviewSlug] = useState("sample-product");

  const firstAxisFirstValue = useMemo(() => {
    if (axes.length === 0 || axes[0].values.length === 0) return null
    return {
      axisName: axes[0].name,
      value: axes[0].values[0].value,
    }
  }, [axes])

  const previewSku = useMemo(() => {
    if (!skuTemplate || !firstAxisFirstValue) return ""
    return generateSkuFromTemplate(skuTemplate, {
      productSlug: previewSlug,
      productId: "preview",
      categorySlug: category.slug,
      axisValues: {
        [firstAxisFirstValue.axisName]: firstAxisFirstValue.value,
      },
    })
  }, [skuTemplate, previewSlug, firstAxisFirstValue, category.slug])

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

  // Axis form
  const axisForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1).max(50),
        sortOrder: z.coerce.number().int().nonnegative().default(0),
      }),
    ) as never,
    defaultValues: { name: "", sortOrder: 0 },
  });

  function openNewAxis() {
    setEditingAxis(null);
    axisForm.reset({ name: "", sortOrder: 0 });
    setAxisDialogOpen(true);
  }

  function openEditAxis(axis: VariantAxisRow) {
    setEditingAxis(axis);
    axisForm.reset({ name: axis.name, sortOrder: axis.sortOrder });
    setAxisDialogOpen(true);
  }

  async function onAxisSubmit(values: { name: string; sortOrder: number }) {
    startTransition(async () => {
      if (editingAxis) {
        await updateVariantAxis(editingAxis.id, values);
      } else {
        await createVariantAxis(category.id, values);
      }
      setAxisDialogOpen(false);
      axisForm.reset();
      router.refresh();
    });
  }

  async function handleDeleteAxis(id: string) {
    if (!confirm(t("confirmDeleteAxis"))) return;
    startTransition(async () => {
      await deleteVariantAxis(id);
      router.refresh();
    });
  }

  // Axis value form
  const valueForm = useForm({
    resolver: zodResolver(
      z.object({
        value: z.string().min(1).max(50),
        sortOrder: z.coerce.number().int().nonnegative().default(0),
        priceDelta: z.coerce.number().default(0),
      }),
    ) as never,
    defaultValues: { value: "", sortOrder: 0, priceDelta: 0 },
  });

  function openNewValue(axisId: string) {
    setEditingValue({ axisId, value: null });
    valueForm.reset({ value: "", sortOrder: 0, priceDelta: 0 });
    setValueDialogOpen(true);
  }

  function openEditValue(axis: VariantAxisRow, value: VariantAxisRow["values"][0]) {
    setEditingValue({ axisId: axis.id, value });
    valueForm.reset({
      value: value.value,
      sortOrder: value.sortOrder,
      priceDelta: value.priceDelta ?? 0,
    });
    setValueDialogOpen(true);
  }

  async function onValueSubmit(values: { value: string; sortOrder: number; priceDelta: number }) {
    if (!editingValue) return
    startTransition(async () => {
      if (editingValue.value) {
        await updateAxisValue(editingValue.value.id, values);
      } else {
        await createAxisValue(editingValue.axisId, values);
      }
      setValueDialogOpen(false);
      valueForm.reset();
      router.refresh();
    });
  }

  async function handleDeleteValue(id: string) {
    if (!confirm(t("confirmDeleteAxisValue"))) return;
    startTransition(async () => {
      await deleteAxisValue(id);
      router.refresh();
    });
  }

  async function handleSkuTemplateSave() {
    startTransition(async () => {
      const result = await updateCategorySkuTemplate(category.id, skuTemplate || null)
      if ("error" in result && result.error) return
      router.refresh()
    })
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

      {/* Variant Axes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("variantAxes")}</CardTitle>
            <CardDescription>{t("variantAxesHint")}</CardDescription>
          </div>
          <Dialog open={axisDialogOpen} onOpenChange={setAxisDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={openNewAxis}>
                <PlusIcon className="mr-1 h-4 w-4" />
                {t("addAxis")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAxis ? t("editAxis") : t("addAxis")}
                </DialogTitle>
              </DialogHeader>
              <Form {...axisForm}>
                <form
                  onSubmit={axisForm.handleSubmit(onAxisSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={axisForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("axisName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>{t("axisNameHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={axisForm.control}
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
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAxisDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingAxis ? t("save") : t("create")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {axes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t("noAxes")}
            </p>
          ) : (
            <div className="space-y-4">
              {axes.map((axis) => (
                <div key={axis.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">{axis.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("valuesCount", { count: axis.values.length })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditAxis(axis)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAxis(axis.id)}
                        disabled={isPending}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {axis.values.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{v.value}</span>
                          <Badge variant="outline" className="text-xs">
                            {t("priceDelta")}: {v.priceDelta ?? 0}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditValue(axis, v)}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteValue(v.id)}
                            disabled={isPending}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => openNewValue(axis.id)}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    {t("addAxisValue")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SKU Template */}
      <Card>
        <CardHeader>
          <CardTitle>{t("skuTemplate")}</CardTitle>
          <CardDescription>{t("skuTemplateHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={skuTemplate}
              onChange={(e) => setSkuTemplate(e.target.value)}
              placeholder={t("skuTemplateHint")}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSkuTemplateSave}
              disabled={isPending}
            >
              {isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("save")}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormLabel className="text-xs text-muted-foreground">
                {t("previewSlug")}
              </FormLabel>
              <Input
                value={previewSlug}
                onChange={(e) => setPreviewSlug(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <FormLabel className="text-xs text-muted-foreground">
                {t("skuPreview")}
              </FormLabel>
              <div className="mt-1 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                {previewSku || (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Axis Value Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue?.value ? t("editAxisValue") : t("addAxisValue")}
            </DialogTitle>
          </DialogHeader>
          <Form {...valueForm}>
            <form
              onSubmit={valueForm.handleSubmit(onValueSubmit)}
              className="space-y-4"
            >
              <FormField
                control={valueForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("axisValue")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>{t("axisValueHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={valueForm.control}
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
                <FormField
                  control={valueForm.control}
                  name="priceDelta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("priceDelta")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>{t("priceDeltaHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setValueDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingValue?.value ? t("save") : t("create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
