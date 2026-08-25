import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getProduct } from "@/actions/product.actions";
import {
  getCategories,
  getFeatureFieldsByCategory,
  getVariantAxesByCategory,
} from "@/actions/category.actions";
import { getBranches } from "@/actions/user.actions";
import { ProductFormWrapper } from "@/components/dashboard/product-form-wrapper";
import { ProductShareDialog, type ShareableProduct } from "@/components/shared/product-share-dialog";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, Share2Icon } from "lucide-react";

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("productForm");

  const [product, categories, branches] = await Promise.all([
    getProduct(id),
    getCategories(),
    user.role === "CENTRAL_ADMIN" ? getBranches() : Promise.resolve([]),
  ]);

  if (!product) notFound();

  const categoryFeatureFields = product.categoryId
    ? await getFeatureFieldsByCategory(product.categoryId)
    : [];

  const initialFeatureFields = categoryFeatureFields.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : null,
    isRequired: f.isRequired,
    sortOrder: f.sortOrder,
  }));

  const variantAxesData = product.categoryId
    ? await getVariantAxesByCategory(product.categoryId)
    : { axes: [], skuTemplate: null }

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  const branchOptions = Array.isArray(branches)
    ? branches.map((b) => ({ id: b.id, name: b.name }))
    : [];

  const defaultValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    basePrice: Number(product.basePrice),
    categoryId: product.categoryId,
    brand: product.brand ?? "",
    commissionType: product.commissionType ?? null,
    commissionValue: product.commissionValue
      ? Number(product.commissionValue)
      : null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color ?? undefined,
      condition: v.condition as "NEW" | "REFURBISHED",
      stock: v.stock,
      price: Number(v.price),
      weight: v.weight ? Number(v.weight) : undefined,
    })),
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
    featureValues:
      product.featureValues?.map((fv) => ({
        featureFieldId: fv.featureFieldId,
        value: fv.value,
      })) ?? [],
  };

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

  const shareableProduct: ShareableProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    basePrice: Number(product.basePrice),
    brand: product.brand ?? undefined,
    categoryName: product.category?.name ?? undefined,
    imageUrl: primaryImage?.url ?? undefined,
    condition: product.variants[0]?.condition ?? "NEW",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("editTitle")}</h1>
          <p className="text-muted-foreground">{t("editSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/products/${product.slug}`} target="_blank">
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              {t("viewStorefront")}
            </Link>
          </Button>
          <ProductShareDialog
            product={shareableProduct}
            trigger={
              <Button variant="outline" size="sm">
                <Share2Icon className="mr-2 h-4 w-4" />
                {t("shareProduct")}
              </Button>
            }
          />
        </div>
      </div>

      <ProductFormWrapper
        categories={categoryOptions}
        branches={branchOptions}
        isCentralAdmin={user.role === "CENTRAL_ADMIN"}
        defaultValues={defaultValues}
        initialFeatureFields={initialFeatureFields}
        variantAxes={variantAxesData.axes}
        skuTemplate={variantAxesData.skuTemplate}
      />
    </div>
  );
}
