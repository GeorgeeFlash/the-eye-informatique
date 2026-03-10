import { Link } from "@/i18n/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const;

export function Logo({
  showName = true,
  size = "md",
  className,
  asLink = true,
}: {
  showName?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  asLink?: boolean;
}) {
  const content = (
    <span className={cn("flex items-center gap-2 font-bold", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold",
          sizes[size],
        )}
      >
        TEI
      </span>
      {showName && <span>{APP_NAME}</span>}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-bold text-lg", className)}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold",
          sizes[size],
        )}
      >
        TEI
      </span>
      {showName && <span className="hidden sm:inline-block">{APP_NAME}</span>}
    </Link>
  );
}
