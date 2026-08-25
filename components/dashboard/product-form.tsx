"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition, useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  productSchema,
  productVariantSchema,
} from "@/lib/validators/product.schema";
import { createProduct, updateProduct } from "@/actions/product.actions";
import { generateVariantsFromAxes } from "@/actions/variant-axis.actions";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/dashboard/image-uploader";

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const formSchema = productSchema.extend({
  variants: z.array(productVariantSchema).min(1, "Add at least one variant"),
  images: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        alt: z.string().optional(),
        sortOrder: z.coerce.number().default(0),
        isPrimary: z.boolean().default(false),
      }),
    )
    .min(1, "At least one image is required"),
  branchId: z.string().cuid().optional(),
  featureValues: z
    .array(
      z.object({
        featureFieldId: z.string().cuid(),
        value: z.string(),
      }),
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryOption = { id: string; name: string };
type BranchOption = { id: string; name: string };
type FeatureField = {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN";
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
};

type VariantAxis = {
  id: string;
  name: string;
  sortOrder: number;
  values: {
    id: string;
    value: string;
    sortOrder: number;
    priceDelta: number | null;
  }[];
};

interface ProductFormProps {
  categories: CategoryOption[];
  branches?: BranchOption[];
  isCentralAdmin: boolean;
  defaultValues?: Partial<FormValues> & { id?: string };
  featureFields?: FeatureField[];
  variantAxes?: VariantAxis[];
  skuTemplate?: string | null;
  onCategoryChange?: (categoryId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({
  categories,
  branches = [],
  isCentralAdmin,
  defaultValues,
  featureFields = [],
  variantAxes = [],
  skuTemplate = null,
  onCategoryChange,
}: ProductFormProps) {
  const t = useTranslations("productForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<"auto" | "manual">(
    skuTemplate ? "auto" : "manual",
  );

  const isEditing = !!defaultValues?.id;
  const hasAxes = variantAxes.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      basePrice: 0,
      categoryId: "",
      brand: "",
      commissionType: null,
      commissionValue: null,
      isActive: true,
      isFeatured: false,
      variants: [{ sku: "", condition: "NEW" as const, stock: 0, price: 0 }],
      images: [],
      featureValues: [],
      ...defaultValues,
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control: form.control, name: "variants" });

  const selectedAxisValueIds = variantAxes.map((axis) =>
    axis.values.map((v) => v.id),
  )

  async function handleGenerateMatrix() {
    setIsGenerating(true)
    startTransition(async () => {
      const basePrice = Number(form.getValues("basePrice")) || 0
      const result = await generateVariantsFromAxes(
        defaultValues!.id!,
        selectedAxisValueIds,
        {
          skuTemplate: skuTemplate ?? undefined,
          autoGenerateSku: generationMode === "auto",
          basePrice,
        },
      )
      if ("error" in result && result.error) {
        setServerError(result.error as string)
        setIsGenerating(false)
        return
      }
      setServerError(null)
      setIsGenerating(false)
      router.refresh()
    })
  }

  const watchCommissionType = form.watch("commissionType");
  const watchCategoryId = form.watch("categoryId");

  // Notify parent when category changes (to load feature fields)
  useEffect(() => {
    if (watchCategoryId && onCategoryChange) {
      onCategoryChange(watchCategoryId);
    }
  }, [watchCategoryId, onCategoryChange]);

  // Clean feature values when category changes to avoid mismatched fields
  const previousCategoryId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      watchCategoryId &&
      previousCategoryId.current &&
      watchCategoryId !== previousCategoryId.current
    ) {
      form.setValue("featureValues", []);
    }
    previousCategoryId.current = watchCategoryId;
  }, [watchCategoryId, form]);

  // Auto-generate slug from name
  const watchName = form.watch("name");
  const handleNameBlur = () => {
    if (!form.getValues("slug")) {
      form.setValue("slug", slugify(watchName));
    }
  };

  const handleRegenerateSlug = useCallback(() => {
    form.setValue("slug", slugify(form.getValues("name") || ""));
  }, [form]);

  const handleImagesChange = useCallback(
    (images: UploadedImage[]) => {
      form.setValue("images", images, { shouldValidate: true });
    },
    [form],
  );

  async function onSubmit(values: FormValues) {
    setServerError(null);

    // Client-side validation for required dynamic feature fields
    const missingRequired = featureFields
      .filter((ff) => ff.isRequired)
      .find((ff) => {
        const fv = values.featureValues?.find(
          (f) => f.featureFieldId === ff.id,
        );
        return !fv || fv.value.trim() === "";
      });

    if (missingRequired) {
      setServerError(t("featureRequiredError"));
      return;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateProduct(defaultValues!.id!, values)
        : await createProduct(values);

      if ("error" in result && result.error) {
        if (typeof result.error === "string") {
          setServerError(result.error);
        } else if (
          typeof result.error === "object" &&
          "fieldErrors" in result.error
        ) {
          // Map server-side Zod field errors to form fields
          const fieldErrors = result.error.fieldErrors as Record<
            string,
            string[]
          >;
          for (const [fieldName, messages] of Object.entries(fieldErrors)) {
            if (messages && messages.length > 0) {
              form.setError(fieldName as keyof FormValues, {
                type: "server",
                message: messages[0],
              });
            }
          }
        } else {
          setServerError(t("validationError"));
        }
        return;
      }

      router.push("/admin/products");
      router.refresh();
    });
  }

  const currentImages = form.watch("images") as UploadedImage[];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Two-column layout: Images left, Form right */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — Images */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{t("images")}</CardTitle>
                <CardDescription>{t("imagesHint")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  value={currentImages}
                  onChange={handleImagesChange}
                  error={
                    form.formState.errors.images?.message ??
                    form.formState.errors.images?.root?.message
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column — Form sections */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t("basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input {...field} onBlur={handleNameBlur} />
                        </FormControl>
                        <FormDescription>{t("nameHint")}</FormDescription>
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormDescription>{t("descriptionHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("category")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectCategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("categoryHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("brand")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>{t("brandHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Commission */}
            <Card>
              <CardHeader>
                <CardTitle>{t("pricingCommission")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("basePrice")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>{t("basePriceHint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="commissionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("commissionType")}</FormLabel>
                        <Select
                          value={field.value ?? "NONE"}
                          onValueChange={(v) => {
                            field.onChange(v === "NONE" ? null : v);
                            if (v === "NONE")
                              form.setValue("commissionValue", null);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NONE">
                              {t("commissionNone")}
                            </SelectItem>
                            <SelectItem value="PERCENTAGE">
                              {t("commissionPercentage")}
                            </SelectItem>
                            <SelectItem value="FIXED">
                              {t("commissionFixed")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("commissionTypeHint")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchCommissionType && (
                    <FormField
                      control={form.control}
                      name="commissionValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchCommissionType === "PERCENTAGE"
                              ? t("commissionPercent")
                              : t("commissionAmount")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={
                                watchCommissionType === "PERCENTAGE"
                                  ? 100
                                  : undefined
                              }
                              step={
                                watchCommissionType === "PERCENTAGE" ? 0.01 : 1
                              }
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {t("commissionValueHint")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Features (dynamic) */}
            {featureFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("categoryFeatures")}</CardTitle>
                  <CardDescription>{t("categoryFeaturesHint")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featureFields
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((ff) => {
                      const fieldIndex = form
                        .getValues("featureValues")
                        ?.findIndex((fv) => fv.featureFieldId === ff.id);
                      const arrayIndex =
                        fieldIndex !== undefined && fieldIndex >= 0
                          ? fieldIndex
                          : null;

                      return (
                        <FormItem key={ff.id}>
                          <FormLabel>
                            {ff.name}
                            {ff.isRequired && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </FormLabel>
                          {ff.type === "DROPDOWN" && ff.options ? (
                            <Select
                              value={
                                arrayIndex !== null
                                  ? form.getValues(
                                      `featureValues.${arrayIndex}.value`,
                                    )
                                  : ""
                              }
                              onValueChange={(v) => {
                                const current =
                                  form.getValues("featureValues") ?? [];
                                if (arrayIndex !== null) {
                                  const updated = [...current];
                                  updated[arrayIndex] = {
                                    ...updated[arrayIndex],
                                    value: v,
                                  };
                                  form.setValue("featureValues", updated);
                                } else {
                                  form.setValue("featureValues", [
                                    ...current,
                                    { featureFieldId: ff.id, value: v },
                                  ]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("selectOption")}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ff.options.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                type={ff.type === "NUMBER" ? "number" : "text"}
                                value={
                                  arrayIndex !== null
                                    ? form.getValues(
                                        `featureValues.${arrayIndex}.value`,
                                      )
                                    : ""
                                }
                                onChange={(e) => {
                                  const current =
                                    form.getValues("featureValues") ?? [];
                                  if (arrayIndex !== null) {
                                    const updated = [...current];
                                    updated[arrayIndex] = {
                                      ...updated[arrayIndex],
                                      value: e.target.value,
                                    };
                                    form.setValue("featureValues", updated);
                                  } else {
                                    form.setValue("featureValues", [
                                      ...current,
                                      {
                                        featureFieldId: ff.id,
                                        value: e.target.value,
                                      },
                                    ]);
                                  }
                                }}
                              />
                            </FormControl>
                          )}
                        </FormItem>
                      );
                    })}
                </CardContent>
              </Card>
            )}

            {/* Variants */}
            {hasAxes ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t("variantMatrix")}</CardTitle>
                    <CardDescription>{t("variantMatrixHint")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={generationMode}
                      onValueChange={(v) =>
                        setGenerationMode(v as "auto" | "manual")
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          {t("autoGenerateSku")}
                        </SelectItem>
                        <SelectItem value="manual">
                          {t("manualEntry")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleGenerateMatrix}
                      disabled={isGenerating || isEditing === false}
                    >
                      {isGenerating && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("generateMatrix")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {variantFields.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {t("noVariants")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">SKU</th>
                            <th className="text-left py-2 px-2">{t("price")} (XAF)</th>
                            <th className="text-left py-2 px-2">{t("stock")}</th>
                            <th className="text-left py-2 px-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variantFields.map((field, index) => (
                            <tr
                              key={field.id}
                              className="border-b last:border-0"
                            >
                              <td className="py-2 px-2">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.sku`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="h-8 text-xs"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.price`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          {...field}
                                          className="h-8 text-xs w-24"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.stock`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          {...field}
                                          className="h-8 text-xs w-20"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                {variantFields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removeVariant(index)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t("variants")}</CardTitle>
                    <CardDescription>{t("variantsHint")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendVariant({
                        sku: "",
                        condition: "NEW",
                        stock: 0,
                        price: 0,
                      })
                    }
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    {t("addVariant")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variantFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {t("variantNum", { n: index + 1 })}
                        </Badge>
                        {variantFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeVariant(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.sku`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>{t("skuHint")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.condition`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("condition")}</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NEW">{t("new")}</SelectItem>
                                  <SelectItem value="REFURBISHED">
                                    {t("refurbished")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("price")} (XAF)</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.stock`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("stock")}</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.color`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("color")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder={t("colorHint")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.weight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("weight")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.001}
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value),
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>{t("weightHint")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Central Admin: branch selector */}
                {isCentralAdmin && !isEditing && branches.length > 0 && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("branch")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectBranch")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>{t("branchHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="font-normal">
                            {t("active")}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {t("activeHint")}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="font-normal">
                            {t("featured")}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {t("featuredHint")}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? t("save") : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
