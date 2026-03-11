import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import {
  getCategories,
  getCategoryWithFeatureFields,
} from "@/actions/category.actions";
import { getTranslations } from "next-intl/server";
import { CategoryEditClient } from "./category-edit-client";

export default async function AdminCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["CENTRAL_ADMIN"]);
  const t = await getTranslations("categoryAdmin");

  const [category, allCategories] = await Promise.all([
    getCategoryWithFeatureFields(id),
    getCategories(),
  ]);

  if (!category) notFound();

  // Exclude self and own children from parent options
  const parentOptions = allCategories
    .filter((c) => c.id !== id && c.parentId !== id)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("editCategory")}
        </h1>
      </div>

      <CategoryEditClient
        category={category}
        featureFields={category.featureFields}
        parentOptions={parentOptions}
      />
    </div>
  );
}
