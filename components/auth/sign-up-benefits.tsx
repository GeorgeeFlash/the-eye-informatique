import { useTranslations } from "next-intl";
import {
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  CoinsIcon,
  HeadphonesIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircle2Icon,
  ShoppingBagIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SignUpBenefitsProps {
  isCheckoutSource?: boolean;
}

export function SignUpBenefits({ isCheckoutSource }: SignUpBenefitsProps) {
  const t = useTranslations("auth");

  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: t("benefitWarrantyTitle"),
      description: t("benefitWarrantyDesc"),
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      borderColor: "border-emerald-500/20",
    },
    {
      icon: CreditCardIcon,
      title: t("benefitInstallmentsTitle"),
      description: t("benefitInstallmentsDesc"),
      color: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      borderColor: "border-purple-500/20",
    },
    {
      icon: TruckIcon,
      title: t("benefitTrackingTitle"),
      description: t("benefitTrackingDesc"),
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      borderColor: "border-amber-500/20",
    },
    {
      icon: CoinsIcon,
      title: t("benefitAffiliateTitle"),
      description: t("benefitAffiliateDesc"),
      color: "text-primary",
      bgColor: "bg-primary/10 dark:bg-primary/20",
      borderColor: "border-primary/20",
    },
    {
      icon: HeadphonesIcon,
      title: t("benefitSupportTitle"),
      description: t("benefitSupportDesc"),
      color: "text-sky-500 dark:text-sky-400",
      bgColor: "bg-sky-500/10 dark:bg-sky-500/20",
      borderColor: "border-sky-500/20",
    },
  ];

  return (
    <div className="flex flex-col justify-center space-y-6 max-w-lg">
      {/* Checkout alert notice if redirected from checkout */}
      {isCheckoutSource && (
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShoppingBagIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {t("checkoutNoticeTitle")}
                <SparklesIcon className="size-3.5 text-primary animate-pulse" />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("checkoutNoticeDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1 font-medium text-xs bg-muted/80 backdrop-blur-sm border border-border"
          >
            <ClockIcon className="size-3 text-primary" />
            {t("fastSignupBadge")}
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("benefitsTitle")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("benefitsSubtitle")}
        </p>
      </div>

      {/* Benefits list */}
      <div className="space-y-3.5">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="group flex items-start gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-all hover:bg-card hover:border-border hover:shadow-sm"
            >
              <div
                className={`shrink-0 rounded-lg p-2.5 ${benefit.bgColor} ${benefit.color} border ${benefit.borderColor} transition-transform group-hover:scale-105`}
              >
                <Icon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <CheckCircle2Icon className="size-3.5 text-muted-foreground/60" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust footer */}
      <div className="pt-2 border-t border-border/50 text-center sm:text-left">
        <p className="text-xs text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          The Eye Informatique — Douala & Yaoundé
        </p>
      </div>
    </div>
  );
}
