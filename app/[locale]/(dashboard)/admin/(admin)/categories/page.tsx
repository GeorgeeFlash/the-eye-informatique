import { requireRole } from "@/lib/auth";
import { getCategories } from "@/actions/category.actions";
import { getTranslations } from "next-intl/server";
import { CategoryListClient } from "./category-list-client";

export default async function AdminCategoriesPage() {
  await requireRole(["CENTRAL_ADMIN"]);
  const t = await getTranslations("categoryAdmin");
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>
      <CategoryListClient categories={categories} />
    </div>
  );
}
