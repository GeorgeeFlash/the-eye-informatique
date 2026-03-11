import { requireRole } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { BlogAnalyticsDashboard } from "./blog-analytics-dashboard";

export async function generateMetadata() {
  const t = await getTranslations("blogAnalytics");
  return { title: t("title") };
}

export default async function BlogAnalyticsPage() {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"]);

  return <BlogAnalyticsDashboard />;
}
