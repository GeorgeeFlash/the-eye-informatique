"use client";

import { useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRightIcon } from "lucide-react";

function humanizeSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("dashboardNavbar");

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const key = `routes.${segment}`;
      const label = t.has(key) ? t(key) : humanizeSegment(segment);

      return {
        href,
        label,
        isLast: index === segments.length - 1,
      };
    });
  }, [pathname, t]);

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {crumbs.map((crumb) => (
          <BreadcrumbItem key={crumb.href}>
            {crumb.isLast ? (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
