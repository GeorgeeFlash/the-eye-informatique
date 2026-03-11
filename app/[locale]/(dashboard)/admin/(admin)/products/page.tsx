import { requireRole } from "@/lib/auth";
import { getProducts } from "@/actions/product.actions";
import { getCategories } from "@/actions/category.actions";
import { getTranslations } from "next-intl/server";
import { ProductListClient } from "./product-list-client";

interface Props {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("productAdmin");
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const branchId = user.role === "CENTRAL_ADMIN" ? null : user.branchId;

  const [productData, categories] = await Promise.all([
    getProducts({
      search: params.search,
      categoryId: params.categoryId,
      branchId,
      page,
      pageSize: 20,
    }),
    getCategories(),
  ]);

  // Serialize Decimal fields to numbers for client component
  const serializedProducts = productData.products.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    commissionValue: p.commissionValue ? Number(p.commissionValue) : null,
    createdAt: p.createdAt.toISOString(),
    variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <ProductListClient
        products={serializedProducts}
        total={productData.total}
        page={productData.page}
        totalPages={productData.totalPages}
        categories={categories}
        isCentralAdmin={user.role === "CENTRAL_ADMIN"}
      />
    </div>
  );
}
