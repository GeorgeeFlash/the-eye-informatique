"use client";

import { Button } from "@/components/ui/button";
import { Share2Icon, CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareLinkButtonProps {
  code: string;
  targetUrl: string;
}

export function ShareLinkButton({ code, targetUrl }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/ref/${code}`;

  const handleShare = async () => {
    const shareData = {
      title: "Check out this product",
      text: `${targetUrl} — Use my link: ${url}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleShare}
        title="Share link"
      >
        <Share2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleCopy}
        title="Copy link"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-600" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
