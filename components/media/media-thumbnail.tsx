"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface MediaThumbnailProps {
  src: string;
  alt: string;
  selected?: boolean;
  inUse?: boolean;
  onClick?: () => void;
}

export function MediaThumbnail({
  src,
  alt,
  selected = false,
  inUse = false,
  onClick,
}: MediaThumbnailProps) {
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/30 transition-colors",
        selected ? "ring-2 ring-primary" : "hover:border-primary/50",
        interactive && "cursor-pointer",
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 16vw"
      />
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </span>
      )}
      {inUse && (
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
          In use
        </span>
      )}
    </button>
  );
}
