"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Branch {
  id: string;
  name: string;
  city: string;
}

interface BranchFilterProps {
  branches: Branch[];
  activeBranchId?: string;
}

export function BranchFilter({ branches, activeBranchId }: BranchFilterProps) {
  const t = useTranslations("storefront");
  const searchParams = useSearchParams();

  function buildHref(branchId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId) {
      params.set("branch", branchId);
    } else {
      params.delete("branch");
    }
    params.delete("page");
    return `/products?${params.toString()}`;
  }

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      <Button
        asChild
        variant={!activeBranchId ? "default" : "outline"}
        size="sm"
      >
        <Link href={buildHref(undefined)}>{t("allBranches")}</Link>
      </Button>
      {branches.map((branch) => (
        <Button
          key={branch.id}
          asChild
          variant={activeBranchId === branch.id ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          <Link href={buildHref(branch.id)}>{branch.city}</Link>
        </Button>
      ))}
    </nav>
  );
}
