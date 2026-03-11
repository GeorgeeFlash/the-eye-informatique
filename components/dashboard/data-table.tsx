"use client";

import { type ReactNode } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface FilterableColumn {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: FilterableColumn[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (page: number) => void;
  onSearchChange?: (value: string) => void;
  toolbar?: ReactNode;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  filterableColumns,
  pageCount,
  pageIndex,
  pageSize = 20,
  onPaginationChange,
  onSearchChange,
  toolbar,
  emptyMessage,
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const t = useTranslations("dataTable");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const isServerPagination =
    pageCount !== undefined && onPaginationChange !== undefined;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(!isServerPagination && {
      getPaginationRowModel: getPaginationRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    }),
    onColumnFiltersChange: isServerPagination ? undefined : setColumnFilters,
    state: {
      columnFilters: isServerPagination ? [] : columnFilters,
      ...(isServerPagination && {
        pagination: { pageIndex: pageIndex ?? 0, pageSize },
      }),
    },
    ...(isServerPagination && {
      pageCount,
      manualPagination: true,
      manualFiltering: true,
    }),
  });

  const currentPage = isServerPagination
    ? (pageIndex ?? 0)
    : table.getState().pagination.pageIndex;
  const totalPages = isServerPagination
    ? (pageCount ?? 1)
    : table.getPageCount();

  return (
    <div className="space-y-4">
      {/* Toolbar row */}
      {(searchKey || filterableColumns?.length || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder ?? t("search")}
              defaultValue={
                isServerPagination
                  ? undefined
                  : ((table.getColumn(searchKey)?.getFilterValue() as string) ??
                    "")
              }
              onChange={(e) => {
                if (isServerPagination && onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  table.getColumn(searchKey)?.setFilterValue(e.target.value);
                }
              }}
              className="max-w-sm"
            />
          )}
          {filterableColumns?.map((fc) => (
            <Select
              key={fc.id}
              value={
                isServerPagination
                  ? undefined
                  : ((table.getColumn(fc.id)?.getFilterValue() as string) ?? "")
              }
              onValueChange={(value) => {
                table.getColumn(fc.id)?.setFilterValue(value || undefined);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={fc.title} />
              </SelectTrigger>
              <SelectContent>
                {fc.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbar && (
            <div className="ml-auto flex items-center gap-2">{toolbar}</div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage ?? t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("pageIndicator", { current: currentPage + 1, total: totalPages })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPagination) {
                onPaginationChange(currentPage - 1);
              } else {
                table.previousPage();
              }
            }}
            disabled={
              isServerPagination
                ? currentPage <= 0
                : !table.getCanPreviousPage()
            }
          >
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPagination) {
                onPaginationChange(currentPage + 1);
              } else {
                table.nextPage();
              }
            }}
            disabled={
              isServerPagination
                ? currentPage >= totalPages - 1
                : !table.getCanNextPage()
            }
          >
            {t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
