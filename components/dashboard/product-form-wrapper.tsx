"use client";

import { useState, useCallback } from "react";
import { ProductForm } from "@/components/dashboard/product-form";
import { getFeatureFieldsByCategory } from "@/actions/category.actions";
import { getVariantAxesByCategory } from "@/actions/variant-axis.actions";

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

type VariantAxis = {
  id: string;
  name: string;
  sortOrder: number;
  values: {
    id: string;
    value: string;
    sortOrder: number;
    priceDelta: number | null;
  }[];
};

interface Props {
  categories: CategoryOption[];
  branches: BranchOption[];
  isCentralAdmin: boolean;
  defaultValues?: Parameters<typeof ProductForm>[0]["defaultValues"];
  initialFeatureFields?: FeatureField[];
  variantAxes?: VariantAxis[];
  skuTemplate?: string | null;
}

export function ProductFormWrapper({
  categories,
  branches,
  isCentralAdmin,
  defaultValues,
  initialFeatureFields = [],
  variantAxes: initialVariantAxes = [],
  skuTemplate: initialSkuTemplate = null,
}: Props) {
  const [featureFields, setFeatureFields] =
    useState<FeatureField[]>(initialFeatureFields);

  const [variantAxes, setVariantAxes] =
    useState<VariantAxis[]>(initialVariantAxes);
  const [skuTemplate, setSkuTemplate] = useState(initialSkuTemplate);

  const handleCategoryChange = useCallback(async (categoryId: string) => {
    const [fields, axesData] = await Promise.all([
      getFeatureFieldsByCategory(categoryId),
      getVariantAxesByCategory(categoryId),
    ])
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
    setVariantAxes(axesData.axes)
    setSkuTemplate(axesData.skuTemplate)
  }, []);

  return (
    <ProductForm
      categories={categories}
      branches={branches}
      isCentralAdmin={isCentralAdmin}
      defaultValues={defaultValues}
      featureFields={featureFields}
      variantAxes={variantAxes}
      skuTemplate={skuTemplate}
      onCategoryChange={handleCategoryChange}
    />
  );
}
