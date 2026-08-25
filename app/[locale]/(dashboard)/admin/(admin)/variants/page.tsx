import { requireRole } from "@/lib/auth";
import { getCategories } from "@/actions/category.actions";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminVariantsPage() {
  await requireRole(["CENTRAL_ADMIN"]);
  const t = await getTranslations("variantsAdmin");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalCategories")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("withAxes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">
              {categories.filter((c) => {
                const cat = c as { variantAxes?: Array<{ values?: unknown[] }> }
                return (cat.variantAxes?.length ?? 0) > 0
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("withTemplate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-2xl font-bold">
              {categories.filter((c) => {
                const cat = c as { skuTemplate?: string | null }
                return !!cat.skuTemplate
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("categories")}</CardTitle>
          <CardDescription>{t("categoriesHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t("noCategories")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">{t("colCategory")}</th>
                    <th className="text-left py-2 px-2">{t("colAxes")}</th>
                    <th className="text-left py-2 px-2">{t("colValues")}</th>
                    <th className="text-left py-2 px-2">{t("colTemplate")}</th>
                    <th className="text-left py-2 px-2">{t("colProducts")}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const cat = category as {
                      variantAxes?: Array<{ values?: unknown[] }>
                      skuTemplate?: string | null
                    }
                    const axesCount = cat.variantAxes?.length ?? 0
                    const valuesCount = cat.variantAxes?.reduce(
                      (sum: number, axis: { values?: unknown[] }) => sum + (axis.values?.length ?? 0),
                      0,
                    ) ?? 0
                    const hasTemplate = !!cat.skuTemplate
                    const productsCount = category._count?.products ?? 0

                    return (
                      <tr key={category.id} className="border-b last:border-0">
                        <td className="py-2 px-2">
                          <Link
                            href={`/admin/categories/${category.id}`}
                            className="font-medium hover:underline"
                          >
                            {category.name}
                          </Link>
                        </td>
                        <td className="py-2 px-2">
                          {axesCount > 0 ? (
                            <Badge variant="outline">{axesCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2">{valuesCount}</td>
                        <td className="py-2 px-2">
                          {hasTemplate ? (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {cat.skuTemplate}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2">{productsCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
