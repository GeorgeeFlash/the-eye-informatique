"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canReviewProduct,
  getMyReview,
  createReview,
  updateReview,
} from "@/actions/review.actions";

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const [isPending, startTransition] = useTransition();

  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const eligibility = await canReviewProduct(productId);

        if (!eligibility.canReview) {
          setCanReview(false);
          setLoading(false);
          return;
        }

        setCanReview(true);

        if (eligibility.hasExistingReview) {
          const myReview = await getMyReview(productId);
          if (myReview) {
            setExistingReviewId(myReview.id);
            setRating(myReview.rating);
            setComment(myReview.comment ?? "");
          }
        }
      } catch {
        // User not authenticated or other error — don't show form
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  if (loading || !canReview) return null;

  const isEditing = !!existingReviewId;

  function handleSubmit() {
    if (rating === 0) {
      toast.error(t("ratingRequired"));
      return;
    }

    startTransition(async () => {
      const data = {
        rating,
        comment: comment.trim() || undefined,
      };

      const result = isEditing
        ? await updateReview(existingReviewId!, data)
        : await createReview(productId, data);

      if (result.error) {
        toast.error(
          typeof result.error === "string" ? result.error : t("ratingRequired"),
        );
      } else {
        toast.success(isEditing ? t("reviewUpdated") : t("reviewSubmitted"));
        if (!isEditing && "reviewId" in result) {
          setExistingReviewId((result as { reviewId: string }).reviewId);
        }
      }
    });
  }

  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? t("editYourReview") : t("writeReview")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("yourRating")}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-0.5 transition-colors"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={isPending}
                aria-label={t("rateStar", { star })}
              >
                <StarIcon
                  className={`h-6 w-6 ${
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("comment")}</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            maxLength={1000}
            rows={3}
            disabled={isPending}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isPending || rating === 0}>
          {isEditing ? t("updateReview") : t("submitReview")}
        </Button>
      </CardContent>
    </Card>
  );
}
