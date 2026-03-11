import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getSetting } from "@/actions/settings.actions";
import { AdminSettingsForm } from "@/components/dashboard/admin-settings-form";

export async function generateMetadata() {
  const t = await getTranslations("adminSettings");
  return { title: t("title") };
}

export default async function AdminSettingsPage() {
  await requireRole(["STAFF", "ADMIN", "CENTRAL_ADMIN"]);
  const t = await getTranslations("adminSettings");

  const [interCityShippingFee, installmentCount] = await Promise.all([
    getSetting<number>("interCityShippingFee", 2500),
    getSetting<number>("installmentCount", 3),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <AdminSettingsForm
        defaults={{ interCityShippingFee, installmentCount }}
      />
    </div>
  );
}
