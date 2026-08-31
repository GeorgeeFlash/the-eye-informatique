import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { icon: "h-6 w-9", text: "text-sm", height: 24, width: 36 },
  md: { icon: "h-8 w-12", text: "text-base font-bold", height: 32, width: 48 },
  lg: { icon: "h-10 w-15", text: "text-lg font-extrabold", height: 40, width: 60 },
  xl: { icon: "h-14 w-21", text: "text-2xl font-extrabold", height: 56, width: 84 },
} as const;

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 320"
      className={cn("shrink-0 select-none overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brandBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="brandRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* Top Red Arc / Crest */}
      <path
        d="M 180 50 Q 285 5 410 50 Q 300 30 180 50 Z"
        fill="url(#brandRed)"
      />

      {/* Letters */}
      <g id="brand-letters">
        {/* Blue T */}
        <path
          d="M 90 102 
             L 375 102 
             L 355 142 
             L 282 142 
             L 215 272 
             L 135 272 
             L 195 142 
             L 165 142 
             L 125 178 
             L 90 178 
             L 125 102 
             Z"
          fill="url(#brandBlue)"
        />

        {/* Red e */}
        <path
          d="M 270 120
             C 220 120, 180 160, 180 205
             C 180 250, 225 275, 275 275
             C 308 275, 335 260, 350 235
             L 310 215
             C 298 230, 282 238, 265 238
             C 240 238, 222 225, 222 205
             L 352 205
             C 355 195, 358 178, 352 160
             C 342 135, 312 120, 270 120 Z
             M 226 175
             C 232 152, 252 145, 272 145
             C 292 145, 305 155, 305 175
             L 226 175 Z"
          fill="url(#brandRed)"
        />

        {/* Black/Dark i */}
        <ellipse
          cx="380"
          cy="115"
          rx="16"
          ry="18"
          className="fill-zinc-900 dark:fill-zinc-100"
          transform="rotate(-15 380 115)"
        />
        <path
          d="M 368 152
             L 332 272
             L 375 272
             C 388 245, 402 215, 412 188
             C 422 165, 435 152, 448 152
             L 448 142
             C 422 142, 395 158, 380 175
             L 388 152
             Z"
          className="fill-zinc-900 dark:fill-zinc-100"
        />
      </g>

      {/* Red Underline Swoosh */}
      <path
        d="M 100 286 
           Q 250 280 395 258
           Q 250 294 100 310
           Z"
        fill="url(#brandRed)"
      />
    </svg>
  );
}

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
  const currentSize = sizes[size] ?? sizes.md;

  const content = (
    <span className={cn("inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]", className)}>
      <BrandMark className={currentSize.icon} />
      {showName && (
        <span className="flex flex-col leading-none">
          <span className={cn("tracking-tight font-extrabold text-foreground", currentSize.text)}>
            {APP_NAME}
          </span>
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Store
          </span>
        </span>
      )}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md", className)}
      aria-label={`${APP_NAME} Home`}
    >
      <BrandMark className={currentSize.icon} />
      {showName && (
        <span className="flex flex-col leading-tight">
          <span className={cn("tracking-tight font-extrabold text-foreground", currentSize.text)}>
            {APP_NAME}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
            Informatique
          </span>
        </span>
      )}
    </Link>
  );
}
