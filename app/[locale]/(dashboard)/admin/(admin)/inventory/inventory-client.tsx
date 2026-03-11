"use client";

import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

type StockRow = {
  id: string;
  productId: string;
  productName: string;
  isActive: boolean;
  sku: string;
  color: string | null;
  condition: string;
  branchId: string;
  branchName: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
};

interface Props {
  data: StockRow[];
  isCentralAdmin: boolean;
}

export function InventoryClient({ data, isCentralAdmin }: Props) {
  const t = useTranslations("inventory");

  const columns: ColumnDef<StockRow>[] = [
    {
      accessorKey: "productName",
      header: t("product"),
      cell: ({ row }) => (
        <Link
          href={`/admin/products/${row.original.productId}`}
          className="font-medium hover:underline"
        >
          {row.original.productName}
        </Link>
      ),
    },
    {
      accessorKey: "sku",
      header: t("sku"),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: "condition",
      header: t("condition"),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.condition}
        </Badge>
      ),
    },
    ...(isCentralAdmin
      ? [
          {
            accessorKey: "branchName",
            header: t("branch"),
          } satisfies ColumnDef<StockRow>,
        ]
      : []),
    {
      accessorKey: "stock",
      header: t("stock"),
      cell: ({ row }) => {
        const { stock, lowStockThreshold, isLowStock } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span
              className={isLowStock ? "font-semibold text-destructive" : ""}
            >
              {stock}
            </span>
            <span className="text-xs text-muted-foreground">
              / {lowStockThreshold}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isLowStock",
      header: t("status"),
      cell: ({ row }) => {
        if (row.original.stock === 0) {
          return <Badge variant="destructive">{t("outOfStock")}</Badge>;
        }
        if (row.original.isLowStock) {
          return (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            >
              {t("lowStock")}
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="text-green-700 dark:text-green-400"
          >
            {t("inStock")}
          </Badge>
        );
      },
    },
  ];

  const branchOptions = isCentralAdmin
    ? [
        ...new Map(
          data.map((r) => [
            r.branchId,
            { label: r.branchName, value: r.branchId },
          ]),
        ).values(),
      ]
    : [];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="productName"
      searchPlaceholder={t("searchPlaceholder")}
      filterableColumns={
        isCentralAdmin
          ? [{ id: "branchName", title: t("branch"), options: branchOptions }]
          : undefined
      }
      emptyMessage={t("empty")}
    />
  );
}
