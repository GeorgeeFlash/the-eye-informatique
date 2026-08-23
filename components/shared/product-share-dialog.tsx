"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Share2Icon,
  CopyIcon,
  CheckIcon,
  SendIcon,
  MailIcon,
  SparklesIcon,
  Loader2Icon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { APP_URL, Locale } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getOrCreateProductAffiliateLink } from "@/actions/affiliate.actions";

export interface ShareableProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  brand?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  condition?: "NEW" | "REFURBISHED" | string;
}

interface ProductShareDialogProps {
  product: ShareableProduct;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductShareDialog({
  product,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ProductShareDialogProps) {
  const t = useTranslations("productShare");
  const tForm = useTranslations("productForm");
  const locale = useLocale() as Locale;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const [shareUrl, setShareUrl] = useState<string>(
    `${APP_URL}/products/${product.slug}`,
  );
  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [isLoadingLink, startLinkTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      startLinkTransition(async () => {
        const result = await getOrCreateProductAffiliateLink(
          product.slug || product.id,
        );
        if (result.isAffiliate && result.url) {
          setShareUrl(result.url);
          setIsAffiliate(true);
        } else {
          setShareUrl(`${APP_URL}/products/${product.slug}`);
          setIsAffiliate(false);
        }
      });
    }
  }, [isOpen, product.id, product.slug]);

  // Clean description summary without HTML tags
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, "").slice(0, 180).trim()
    : "";

  const formattedPrice = formatCurrency(product.basePrice, locale);
  const conditionLabel =
    product.condition === "REFURBISHED" ? tForm("refurbished") : tForm("new");

  // Construct high-converting marketing pitch
  const marketingPitch = [
    `🛍️ *${product.name}*`,
    `💰 *${locale === "fr" ? "Prix :" : "Price:"}* ${formattedPrice}`,
    product.brand
      ? `🏷️ *${locale === "fr" ? "Marque :" : "Brand:"}* ${product.brand}`
      : null,
    product.categoryName
      ? `📂 *${locale === "fr" ? "Catégorie :" : "Category:"}* ${product.categoryName}`
      : null,
    `✨ *${locale === "fr" ? "État :" : "Condition:"}* ${conditionLabel}`,
    plainDescription ? `\n📝 ${plainDescription}...` : null,
    `\n👉 *${locale === "fr" ? "Commander directement ici :" : "Order directly here:"}* ${shareUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyPitch = async () => {
    try {
      await navigator.clipboard.writeText(marketingPitch);
      setCopiedPitch(true);
      toast.success(t("pitchCopied"));
      setTimeout(() => setCopiedPitch(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: marketingPitch,
          url: shareUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyPitch();
    }
  };

  // Social share links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(marketingPitch)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(marketingPitch)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(marketingPitch)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(marketingPitch)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2Icon className="h-4 w-4" />
            {t("title")}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg p-6 sm:rounded-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Share2Icon className="h-5 w-5 text-primary" />
              {t("title")}
            </DialogTitle>
            {isLoadingLink ? (
              <Badge variant="outline" className="animate-pulse gap-1 text-xs">
                <Loader2Icon className="h-3 w-3 animate-spin" />
                {t("generatingLink")}
              </Badge>
            ) : isAffiliate ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                {t("affiliateBadge")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {t("adminBadge")}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Visual Card Preview */}
          <div className="flex gap-4 rounded-xl border bg-muted/30 p-3 shadow-xs">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-background">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  —
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.categoryName && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {product.categoryName}
                  </Badge>
                )}
                <Badge
                  variant={product.condition === "NEW" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {conditionLabel}
                </Badge>
              </div>

              <h4 className="font-semibold text-sm truncate mt-1 text-foreground">
                {product.name}
              </h4>
              {product.brand && (
                <p className="text-xs text-muted-foreground">{product.brand}</p>
              )}

              <p className="font-bold text-primary text-sm mt-1">
                {formattedPrice}
              </p>
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-xs h-9 bg-background select-all"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 gap-1.5 h-9"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
                {t("copyLink")}
              </Button>
            </div>
          </div>

          {/* Social Quick Share Actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === "fr" ? "Partager sur les réseaux" : "Share to channels"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {/* WhatsApp */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 border-green-200 bg-green-50/50 hover:bg-green-100 hover:text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-700 dark:text-green-400 font-medium justify-start gap-2"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <SendIcon className="h-4 w-4" />
                  {t("shareOnWhatsApp")}
                </a>
              </Button>

              {/* Facebook */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium justify-start gap-2"
              >
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4" />
                  {t("shareOnFacebook")}
                </a>
              </Button>

              {/* Telegram */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 border-sky-200 bg-sky-50/50 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-medium justify-start gap-2"
              >
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <SendIcon className="h-4 w-4" />
                  {t("shareOnTelegram")}
                </a>
              </Button>

              {/* Twitter/X */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 font-medium justify-start gap-2"
              >
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4" />
                  {t("shareOnTwitter")}
                </a>
              </Button>

              {/* Email */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 font-medium justify-start gap-2"
              >
                <a href={emailUrl}>
                  <MailIcon className="h-4 w-4" />
                  {t("shareViaEmail")}
                </a>
              </Button>

              {/* Native Web Share */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 font-medium justify-start gap-2"
                onClick={handleNativeShare}
              >
                <Share2Icon className="h-4 w-4" />
                {t("nativeShare")}
              </Button>
            </div>
          </div>

          {/* Copy Full Marketing Text Banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <SparklesIcon className="h-3.5 w-3.5" />
                {locale === "fr"
                  ? "Argumentaire de vente prêt à l'emploi"
                  : "Ready-to-Post Marketing Pitch"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={handleCopyPitch}
              >
                {copiedPitch ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                {t("copyPitch")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3 bg-background/80 p-2 rounded border font-mono">
              {marketingPitch}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
