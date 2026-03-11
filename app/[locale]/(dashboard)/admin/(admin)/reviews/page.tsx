import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getPendingReviews } from "@/actions/review.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquareIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReviewActions } from "./review-actions";

export async function generateMetadata() {
  const t = await getTranslations("reviewModeration");
  return { title: t("title") };
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const t = await getTranslations("reviewModeration");
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const validStatus = ["PENDING", "APPROVED", "REJECTED"].includes(status ?? "")
    ? (status as "PENDING" | "APPROVED" | "REJECTED")
    : undefined;

  const { reviews, total, totalPages } = await getPendingReviews({
    page,
    status: validStatus,
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {[undefined, "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <Button
            key={s ?? "all"}
            variant={validStatus === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/admin/reviews${s ? `?status=${s}` : ""}`}>
              {s ? t(`status.${s}`) : t("all")}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="size-5" />
            <CardTitle>{t("reviewsLabel")}</CardTitle>
          </div>
          <CardDescription>
            {t("totalReviews", { count: total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noReviews")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{t("reviewer")}</TableHead>
                  <TableHead>{t("rating")}</TableHead>
                  <TableHead>{t("commentLabel")}</TableHead>
                  <TableHead>{t("statusLabel")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {review.product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {review.user.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </TableCell>
                    <TableCell className="max-w-50 truncate text-muted-foreground">
                      {review.comment ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[review.status] ?? "outline"}
                      >
                        {t(`status.${review.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReviewActions
                        reviewId={review.id}
                        status={review.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                <Link
                  href={`/admin/reviews?page=${page - 1}${validStatus ? `&status=${validStatus}` : ""}`}
                >
                  ←
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={page >= totalPages}
              >
                <Link
                  href={`/admin/reviews?page=${page + 1}${validStatus ? `&status=${validStatus}` : ""}`}
                >
                  →
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
