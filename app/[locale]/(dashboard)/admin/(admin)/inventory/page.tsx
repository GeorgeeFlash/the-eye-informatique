import { requireRole } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { getConsolidatedStock } from "@/actions/product.actions";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const user = await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("inventory");
  const isCentralAdmin = user.role === "CENTRAL_ADMIN";

  const stockRecords = await getConsolidatedStock(
    isCentralAdmin ? undefined : user.branchId!,
  );

  const rows = stockRecords.map((r) => ({
    id: `${r.variantId}-${r.branchId}`,
    productId: r.variant.product.id,
    productName: r.variant.product.name,
    isActive: r.variant.product.isActive,
    sku: r.variant.sku,
    color: r.variant.color,
    condition: r.variant.condition,
    branchId: r.branch.id,
    branchName: r.branch.name,
    stock: r.stock,
    lowStockThreshold: r.lowStockThreshold,
    isLowStock: r.stock <= r.lowStockThreshold,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <InventoryClient data={rows} isCentralAdmin={isCentralAdmin} />
    </div>
  );
}
