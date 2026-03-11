import { getTranslations } from "next-intl/server";
import { sanityFetch } from "@/sanity/lib/live";
import { AFFILIATE_LANDING_QUERY } from "@/sanity/lib/queries";
import { Link } from "@/i18n/navigation";
import { PortableText } from "@portabletext/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CircleHelpIcon,
  TrendingUpIcon,
  BarChart3Icon,
  WalletIcon,
  ImageIcon,
  ClockIcon,
  ShieldCheckIcon,
  HeadphonesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BENEFIT_ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp: TrendingUpIcon,
  BarChart3: BarChart3Icon,
  Wallet: WalletIcon,
  Image: ImageIcon,
  Clock: ClockIcon,
  ShieldCheck: ShieldCheckIcon,
  Headphones: HeadphonesIcon,
};

export default async function AffiliateLandingPage() {
  const t = await getTranslations("affiliateLanding");
  const { data } = await sanityFetch({ query: AFFILIATE_LANDING_QUERY });

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        <Button asChild className="mt-8" size="lg">
          <Link href="/affiliate/apply">{t("applyNow")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            {data.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {data.subtitle}
          </p>
          {data.heroDescription && (
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              {data.heroDescription}
            </p>
          )}
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard/affiliate-apply">
                {data.cta?.buttonLabel ?? t("applyNow")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      {data.howItWorks?.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("howItWorksTitle")}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {data.howItWorks.map(
                (step: {
                  _key: string;
                  stepNumber: number;
                  title: string;
                  description: string;
                  icon?: string;
                }) => (
                  <Card key={step._key} className="text-center">
                    <CardContent className="pt-6">
                      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                        {step.stepNumber}
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      {data.benefits?.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("benefitsTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.benefits.map(
                (benefit: {
                  _key: string;
                  title: string;
                  description: string;
                  icon?: string;
                }) => {
                  const BenefitIcon = benefit.icon
                    ? (BENEFIT_ICON_MAP[benefit.icon] ?? CircleHelpIcon)
                    : CheckCircleIcon;

                  return (
                    <div key={benefit._key} className="flex gap-3">
                      <BenefitIcon className="mt-0.5 size-5 shrink-0 text-green-500" />
                      <div>
                        <h3 className="font-medium">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* Commission Note */}
      {data.commissionNote && (
        <section className="border-t py-10">
          <div className="container mx-auto px-4 text-center">
            <p className="mx-auto max-w-xl text-muted-foreground">
              {data.commissionNote}
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faq?.length > 0 && (
        <section className="border-t py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold">
              {t("faqTitle")}
            </h2>
            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible className="w-full">
                {data.faq.map(
                  (item: {
                    _key: string;
                    question: string;
                    answer: { _type: string; [key: string]: unknown }[];
                  }) => (
                    <AccordionItem key={item._key} value={item._key}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                        <PortableText value={item.answer} />
                      </AccordionContent>
                    </AccordionItem>
                  ),
                )}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {data.cta && (
        <section className="border-t bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold">{data.cta.title}</h2>
            {data.cta.description && (
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                {data.cta.description}
              </p>
            )}
            <Button asChild size="lg" className="mt-6">
              <Link href={data.cta.buttonHref ?? "/dashboard/affiliate-apply"}>
                {data.cta.buttonLabel ?? t("applyNow")}
                <ArrowRightIcon className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
