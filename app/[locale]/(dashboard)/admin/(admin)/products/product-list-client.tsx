/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTransition, useCallback, useRef, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { deleteProduct } from "@/actions/product.actions";
import { Locale } from "@/lib/constants";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  basePrice: number;
  brand: string | null;
  commissionType: string | null;
  commissionValue: number | null;
  createdAt: string | Date;
  category: { id: string; name: string } | null;
  images: { url: string }[];
  variants: { id: string; price: number; stock: number; condition: string }[];
};

type CategoryItem = {
  id: string;
  name: string;
  _count: { products: number };
};

interface Props {
  products: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
  categories: CategoryItem[];
  isCentralAdmin: boolean;
}

export function ProductListClient({
  products,
  total,
  page,
  totalPages,
  categories,
  isCentralAdmin,
}: Props) {
  const t = useTranslations("productAdmin");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateParams("search", value);
      }, 400);
    },
    [updateParams],
  );

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  const totalStock = (variants: ProductRow["variants"]) =>
    variants.reduce((sum, v) => sum + v.stock, 0);

  const minPrice = (variants: ProductRow["variants"]) =>
    variants.length > 0 ? Math.min(...variants.map((v) => Number(v.price))) : 0;

  const columns: ColumnDef<ProductRow>[] = [
    {
      accessorKey: "name",
      header: t("colName"),
      cell: ({ row }) => {
        const product = row.original;
        const img = product.images[0]?.url;
        return (
          <div className="flex items-center gap-3">
            {img ? (
              <Image
                src={img}
                alt={product.name}
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs">
                —
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{product.name}</p>
              {product.brand && (
                <p className="text-xs text-muted-foreground">{product.brand}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: t("colCategory"),
      cell: ({ row }) => row.original.category?.name ?? "—",
    },
    {
      id: "price",
      header: t("colPrice"),
      cell: ({ row }) =>
        formatCurrency(minPrice(row.original.variants), locale),
    },
    {
      id: "stock",
      header: t("colStock"),
      cell: ({ row }) => {
        const stock = totalStock(row.original.variants);
        return (
          <Badge
            variant={
              stock === 0 ? "destructive" : stock <= 3 ? "secondary" : "outline"
            }
          >
            {stock}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: t("colStatus"),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? t("active") : t("archived")}
        </Badge>
      ),
    },
    {
      id: "commission",
      header: t("colCommission"),
      cell: ({ row }) => {
        const { commissionType, commissionValue } = row.original;
        if (!commissionType || !commissionValue)
          return (
            <span className="text-xs text-muted-foreground">
              {t("defaultCommission")}
            </span>
          );
        return (
          <Badge variant="outline" className="text-xs">
            {commissionType === "PERCENTAGE"
              ? `${commissionValue}%`
              : formatCurrency(commissionValue, locale)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("colDate"),
      cell: ({ row }) => {
        const d = new Date(row.original.createdAt);
        return (
          <span className="text-xs text-muted-foreground">
            {d.toLocaleDateString(locale)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${row.original.id}`}>
                <PencilIcon className="mr-2 h-4 w-4" />
                {t("edit")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              {t("archive")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              defaultValue={searchParams.get("search") ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            defaultValue={searchParams.get("categoryId") ?? "all"}
            onValueChange={(v) =>
              updateParams("categoryId", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c._count.products})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            {t("addProduct")}
          </Link>
        </Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showing", { count: products.length, total })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams("page", String(page - 1))}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams("page", String(page + 1))}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
