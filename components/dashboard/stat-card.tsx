import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRightIcon, ArrowUpRightIcon, LucideIcon } from "lucide-react";

type StatCardTone = "violet" | "mint" | "rose" | "amber" | "sky";

const TONES: Record<
  StatCardTone,
  {
    card: string;
    iconWrap: string;
    icon: string;
    trendPositive: string;
    trendNegative: string;
    sparkline: string;
  }
> = {
  violet: {
    card: "border-violet-100/80 bg-gradient-to-br from-violet-100/70 via-violet-50 to-white",
    iconWrap: "bg-violet-200/60",
    icon: "text-violet-700",
    trendPositive: "text-emerald-700",
    trendNegative: "text-rose-700",
    sparkline: "bg-violet-500/55",
  },
  mint: {
    card: "border-emerald-100/80 bg-gradient-to-br from-emerald-100/60 via-emerald-50 to-white",
    iconWrap: "bg-emerald-200/60",
    icon: "text-emerald-700",
    trendPositive: "text-emerald-700",
    trendNegative: "text-rose-700",
    sparkline: "bg-emerald-500/60",
  },
  rose: {
    card: "border-rose-100/80 bg-gradient-to-br from-rose-100/70 via-rose-50 to-white",
    iconWrap: "bg-rose-200/60",
    icon: "text-rose-700",
    trendPositive: "text-emerald-700",
    trendNegative: "text-rose-700",
    sparkline: "bg-indigo-500/60",
  },
  amber: {
    card: "border-amber-100/80 bg-gradient-to-br from-amber-100/65 via-amber-50 to-white",
    iconWrap: "bg-amber-200/60",
    icon: "text-amber-700",
    trendPositive: "text-emerald-700",
    trendNegative: "text-rose-700",
    sparkline: "bg-pink-500/60",
  },
  sky: {
    card: "border-sky-100/80 bg-gradient-to-br from-sky-100/70 via-sky-50 to-white",
    iconWrap: "bg-sky-200/60",
    icon: "text-sky-700",
    trendPositive: "text-emerald-700",
    trendNegative: "text-rose-700",
    sparkline: "bg-sky-500/60",
  },
};

const TONE_SEQUENCE: StatCardTone[] = [
  "violet",
  "mint",
  "rose",
  "amber",
  "sky",
];

function pickTone(title: string): StatCardTone {
  const hash = [...title].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TONE_SEQUENCE[hash % TONE_SEQUENCE.length];
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  tone?: StatCardTone;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  tone,
}: StatCardProps) {
  const resolvedTone = tone ?? pickTone(title);
  const toneClasses = TONES[resolvedTone];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border shadow-sm transition-transform duration-200 hover:-translate-y-0.5",
        toneClasses.card,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-semibold text-foreground/80">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              toneClasses.iconWrap,
            )}
          >
            <Icon className={cn("h-5 w-5", toneClasses.icon)} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-bold tracking-tight text-foreground/85">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-base font-medium",
              trend.positive
                ? toneClasses.trendPositive
                : toneClasses.trendNegative,
            )}
          >
            {trend.positive ? (
              <ArrowUpRightIcon className="h-4 w-4" />
            ) : (
              <ArrowDownRightIcon className="h-4 w-4" />
            )}
            {trend.positive ? "+" : ""}
            {trend.value}%
          </p>
        )}

        <div className="pt-2">
          <div className="flex h-10 items-end gap-1.5" aria-hidden>
            {[4, 8, 6, 12, 7, 14, 9, 16, 5, 11, 8, 15].map((bar, index) => (
              <span
                // Decorative bars to emulate compact trend sparkline cards
                key={`${title}-${bar}-${index}`}
                className={cn("w-1.5 rounded-full", toneClasses.sparkline)}
                style={{ height: `${bar * 2}px` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
