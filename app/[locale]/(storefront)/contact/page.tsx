import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { ContactForm } from "@/components/storefront/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, PhoneIcon, MapPinIcon } from "lucide-react";

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const branches = await db.branch.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Contact form - takes 3 columns */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        {/* Branches sidebar - takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">{t("branchesTitle")}</h2>
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {branch.name}
                  {branch.name === "Bamenda" && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({t("headquarters")})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {branch.address}, {branch.city}
                  </span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="size-4 shrink-0" />
                    <a
                      href={`tel:${branch.phone}`}
                      className="hover:text-foreground transition-colors"
                    >
                      {branch.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MailIcon className="size-4 shrink-0" />
                  <a
                    href="mailto:contact@theeyeinformatique.cm"
                    className="hover:text-foreground transition-colors"
                  >
                    contact@theeyeinformatique.cm
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
