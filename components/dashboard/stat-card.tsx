import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRightIcon, ArrowUpRightIcon, LucideIcon } from "lucide-react";

type StatCardTone = "blue" | "red" | "emerald" | "amber" | "indigo";

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
  blue: {
    card: "border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-card dark:from-primary/15 dark:via-primary/5 dark:to-card/80",
    iconWrap: "bg-primary/15 text-primary border border-primary/20",
    icon: "text-primary",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-destructive",
    sparkline: "bg-primary/50 dark:bg-primary/70",
  },
  red: {
    card: "border-destructive/20 bg-linear-to-br from-destructive/10 via-destructive/5 to-card dark:from-destructive/15 dark:via-destructive/5 dark:to-card/80",
    iconWrap: "bg-destructive/15 text-destructive border border-destructive/20",
    icon: "text-destructive",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-destructive",
    sparkline: "bg-destructive/50 dark:bg-destructive/70",
  },
  emerald: {
    card: "border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-card dark:from-emerald-500/15 dark:via-emerald-500/5 dark:to-card/80",
    iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-destructive",
    sparkline: "bg-emerald-500/50 dark:bg-emerald-500/70",
  },
  amber: {
    card: "border-amber-500/20 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-card dark:from-amber-500/15 dark:via-amber-500/5 dark:to-card/80",
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-destructive",
    sparkline: "bg-amber-500/50 dark:bg-amber-500/70",
  },
  indigo: {
    card: "border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-indigo-500/5 to-card dark:from-indigo-500/15 dark:via-indigo-500/5 dark:to-card/80",
    iconWrap: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    trendPositive: "text-emerald-600 dark:text-emerald-400",
    trendNegative: "text-destructive",
    sparkline: "bg-indigo-500/50 dark:bg-indigo-500/70",
  },
};

const TONE_SEQUENCE: StatCardTone[] = [
  "blue",
  "red",
  "emerald",
  "amber",
  "indigo",
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
  const toneClasses = TONES[resolvedTone] ?? TONES.blue;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
        toneClasses.card,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 pt-5 px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              toneClasses.iconWrap,
            )}
          >
            <Icon className={cn("h-5 w-5", toneClasses.icon)} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 px-5 pb-5">
        <div className="text-3xl font-extrabold tracking-tight text-foreground">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs font-bold",
              trend.positive
                ? toneClasses.trendPositive
                : toneClasses.trendNegative,
            )}
          >
            {trend.positive ? (
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRightIcon className="h-3.5 w-3.5" />
            )}
            {trend.positive ? "+" : ""}
            {trend.value}%
          </p>
        )}

        <div className="pt-2">
          <div className="flex h-8 items-end gap-1.5" aria-hidden>
            {[4, 8, 6, 12, 7, 14, 9, 16, 5, 11, 8, 15].map((bar, index) => (
              <span
                key={`${title}-${bar}-${index}`}
                className={cn("w-1.5 rounded-full transition-all duration-300", toneClasses.sparkline)}
                style={{ height: `${bar * 1.8}px` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
