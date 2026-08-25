import { requireRole } from "@/lib/auth";
import { db } from "@/server/db";
import { MediaClient } from "./media-client";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const PAGE_SIZE = 24;

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireRole(["ADMIN", "CENTRAL_ADMIN"]);

  const { search, page } = await searchParams;
  const query = search?.trim() ?? "";
  const currentPage = Math.max(1, Number(page) || 1);

  const images = await db.imageAsset.findMany({
    where: {
      mimeType: { in: ALLOWED_MIME_TYPES as unknown as string[] },
      ...(query ? { fileName: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      url: true,
      fileName: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });

  const total = await db.imageAsset.count({
    where: {
      mimeType: { in: ALLOWED_MIME_TYPES as unknown as string[] },
      ...(query ? { fileName: { contains: query, mode: "insensitive" } } : {}),
    },
  });

  const referenced = await db.category.findMany({
    where: { iconUrl: { not: null } },
    select: { iconUrl: true },
  });
  const referencedUrls = new Set(referenced.map((c) => c.iconUrl));

  const imagesWithUse = images.map((img) => ({
    ...img,
    inUse: referencedUrls.has(img.url),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Browse, upload, and select images for your categories.
        </p>
      </div>
      <MediaClient
        initialImages={imagesWithUse}
        search={query}
        total={total}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
      />
    </div>
  );
}
