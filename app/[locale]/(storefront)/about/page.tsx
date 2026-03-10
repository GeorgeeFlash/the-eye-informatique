import { getTranslations } from "next-intl/server";
import { sanityFetch } from "@/sanity/lib/live";
import { urlFor } from "@/sanity/lib/image";
import { ABOUT_PAGE_QUERY } from "@/sanity/lib/queries";
import { PortableText } from "@portabletext/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinIcon,
  BadgeCheckIcon,
  CircleHelpIcon,
  MonitorIcon,
  WrenchIcon,
  CableIcon,
  SettingsIcon,
  TruckIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  Monitor: MonitorIcon,
  Wrench: WrenchIcon,
  Cable: CableIcon,
  Settings: SettingsIcon,
  Truck: TruckIcon,
  ShieldCheck: ShieldCheckIcon,
  Smartphone: SmartphoneIcon,
};

export default async function AboutPage() {
  const t = await getTranslations("about");
  const { data } = await sanityFetch({ query: ABOUT_PAGE_QUERY });

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20">
        {data.bannerImage && (
          <Image
            src={urlFor(data.bannerImage).width(1920).height(720).url()}
            alt={data.title}
            fill
            className="object-cover opacity-20"
            priority
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-background/35" />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {data.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Mission */}
      {data.mission && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-center text-2xl font-bold">
              {data.mission.title ?? t("missionTitle")}
            </h2>
            <div className="prose prose-lg dark:prose-invert mx-auto max-w-3xl">
              <PortableText value={data.mission.body} />
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      {data.story && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-center text-2xl font-bold">
              {data.story.title ?? t("storyTitle")}
            </h2>
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <PortableText value={data.story.body} />
              </div>
              {data.story.image && (
                <div className="overflow-hidden rounded-xl border bg-card">
                  <Image
                    src={urlFor(data.story.image).width(900).height(700).url()}
                    alt={data.story.title ?? t("storyTitle")}
                    width={900}
                    height={700}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {data.services?.length > 0 && (
        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("servicesTitle")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.services.map(
                (service: {
                  _key: string;
                  title: string;
                  description: string;
                  icon?: string;
                  image?: { asset: { _ref: string } };
                }) => {
                  const ServiceIcon = service.icon
                    ? (SERVICE_ICON_MAP[service.icon] ?? CircleHelpIcon)
                    : null;

                  return (
                    <Card key={service._key}>
                      <CardContent className="pt-6">
                        {service.image && (
                          <div className="mb-4 overflow-hidden rounded-lg border">
                            <Image
                              src={urlFor(service.image)
                                .width(640)
                                .height(360)
                                .url()}
                              alt={service.title}
                              width={640}
                              height={360}
                              className="h-40 w-full object-cover"
                            />
                          </div>
                        )}
                        {ServiceIcon && (
                          <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ServiceIcon className="size-5" />
                          </span>
                        )}
                        <h3 className="mb-2 font-semibold">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {data.stats?.length > 0 && (
        <section className="border-t bg-primary/5 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("statsTitle")}
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {data.stats.map(
                (stat: { _key: string; value: string; label: string }) => (
                  <div key={stat._key} className="text-center">
                    <div className="text-3xl font-extrabold text-primary">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {data.team?.length > 0 && (
        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("teamTitle")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.team.map(
                (member: {
                  _key: string;
                  name: string;
                  role: string;
                  image?: { asset: { _ref: string } };
                }) => (
                  <div key={member._key} className="text-center">
                    {member.image ? (
                      <Image
                        src={urlFor(member.image).width(200).height(200).url()}
                        alt={member.name}
                        width={200}
                        height={200}
                        className="mx-auto mb-3 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto mb-3 flex size-50 items-center justify-center rounded-full bg-muted text-4xl font-bold text-muted-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Branches */}
      {data.branches?.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("branchesTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.branches.map(
                (branch: {
                  _key: string;
                  name: string;
                  city: string;
                  address: string;
                  phone?: string;
                  email?: string;
                  isHQ?: boolean;
                }) => (
                  <Card key={branch._key}>
                    <CardContent className="pt-6">
                      <div className="mb-3 flex items-center gap-2">
                        <MapPinIcon className="size-4 text-primary" />
                        <h3 className="font-semibold">{branch.name}</h3>
                        {branch.isHQ && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            <BadgeCheckIcon className="size-3" />
                            {t("headquarters")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {branch.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {branch.city}
                      </p>
                      {branch.phone && (
                        <p className="mt-2 text-sm">
                          <a
                            href={`tel:${branch.phone}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {branch.phone}
                          </a>
                        </p>
                      )}
                      {branch.email && (
                        <p className="text-sm">
                          <a
                            href={`mailto:${branch.email}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {branch.email}
                          </a>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
