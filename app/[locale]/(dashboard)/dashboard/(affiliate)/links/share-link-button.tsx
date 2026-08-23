"use client";

import { Button } from "@/components/ui/button";
import { Share2Icon, CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ShareLinkButtonProps {
  code: string;
  targetUrl: string;
}

export function ShareLinkButton({ code, targetUrl }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("productShare");

  const getUrl = () => `${window.location.origin}/ref/${code}`;

  const handleShare = async () => {
    const url = getUrl();
    const shareData = {
      title: t("shareLinkTitle"),
      text: t("shareLinkText", { targetUrl, url }),
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
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyError"));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleShare}
        title={t("shareLinkTooltip")}
      >
        <Share2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleCopy}
        title={t("copyLinkTooltip")}
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
