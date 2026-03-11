"use client";

import { useState, useCallback } from "react";
import { ProductForm } from "@/components/dashboard/product-form";
import { getFeatureFieldsByCategory } from "@/actions/category.actions";

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

interface Props {
  categories: CategoryOption[];
  branches: BranchOption[];
  isCentralAdmin: boolean;
  defaultValues?: Parameters<typeof ProductForm>[0]["defaultValues"];
  initialFeatureFields?: FeatureField[];
}

export function ProductFormWrapper({
  categories,
  branches,
  isCentralAdmin,
  defaultValues,
  initialFeatureFields = [],
}: Props) {
  const [featureFields, setFeatureFields] =
    useState<FeatureField[]>(initialFeatureFields);

  const handleCategoryChange = useCallback(async (categoryId: string) => {
    const fields = await getFeatureFieldsByCategory(categoryId);
    setFeatureFields(
      fields.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      })),
    );
  }, []);

  return (
    <ProductForm
      categories={categories}
      branches={branches}
      isCentralAdmin={isCentralAdmin}
      defaultValues={defaultValues}
      featureFields={featureFields}
      onCategoryChange={handleCategoryChange}
    />
  );
}
