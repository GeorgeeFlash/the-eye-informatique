import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAddresses } from "@/actions/order.actions";
import { getBranches } from "@/actions/user.actions";
import { getSetting } from "@/actions/settings.actions";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { DEFAULT_INTER_CITY_FEE } from "@/lib/shipping";

export async function generateMetadata() {
  const t = await getTranslations("checkout");
  return { title: t("title") };
}

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [addresses, branches, installmentCount, interCityShippingFee] =
    await Promise.all([
      getUserAddresses(),
      getBranches(),
      getSetting<number>("installmentCount", 3),
      getSetting<number>("interCityShippingFee", DEFAULT_INTER_CITY_FEE),
    ]);

  const t = await getTranslations("checkout");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <CheckoutForm
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          street: a.street,
          city: a.city,
          region: a.region,
        }))}
        branches={branches}
        installmentCount={installmentCount}
        interCityShippingFee={interCityShippingFee}
      />
    </div>
  );
}
