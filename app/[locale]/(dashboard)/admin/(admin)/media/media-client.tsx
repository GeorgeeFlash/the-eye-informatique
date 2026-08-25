"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CopyIcon,
  Loader2Icon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { MediaThumbnail } from "@/components/media/media-thumbnail";

interface MediaImage {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
  inUse: boolean;
}

interface MediaClientProps {
  initialImages: MediaImage[];
  search: string;
  total: number;
  pageSize: number;
  currentPage: number;
}

export function MediaClient({
  initialImages,
  search,
  total,
  pageSize,
  currentPage,
}: MediaClientProps) {
  const t = useTranslations("media");
  const router = useRouter();
  const [images, setImages] = useState<MediaImage[]>(initialImages);
  const [query, setQuery] = useState(search);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(currentPage),
      take: String(pageSize),
      ...(search ? { search } : {}),
    });
    fetch(`/api/media?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { images: MediaImage[] } | null) => {
        if (active && json) setImages(json.images);
      });
    return () => {
      active = false;
    };
  }, [search, pageSize, currentPage]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      page: "1",
      ...(query ? { search: query } : {}),
    });
    router.push(`/admin/media?${params.toString()}`);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("folder", "media");
      formData.append("files", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error(t("uploadFailed"));
        return;
      }

      toast.success(t("uploadImage"));
      const params = new URLSearchParams({
        page: String(currentPage),
        take: String(pageSize),
        ...(query ? { search: query } : {}),
      });
      const refresh = await fetch(`/api/media?${params.toString()}`);
      if (refresh.ok) {
        const json = (await refresh.json()) as { images: MediaImage[] };
        setImages(json.images);
      }
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success(t("urlCopied"));
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      if (res.status === 409) {
        toast.error(t("deleteInUseError"));
        return;
      }
      if (!res.ok) {
        toast.error(t("deleteFailed"));
        return;
      }
      toast.success(t("deleteImage"));
      router.refresh();
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            {t("searchPlaceholder")}
          </Button>
        </form>

        <div
          className="flex flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-4 text-center transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <UploadIcon className="size-5 text-muted-foreground" />
              <label className="mt-1 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
                {t("uploadNew")}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("noImages")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="space-y-1">
              <div className="relative">
                <MediaThumbnail src={img.url} alt={img.fileName} inUse={img.inUse} />
                <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1 opacity-0 transition-opacity hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    title={t("copyUrl")}
                    onClick={() => handleCopy(img.url)}
                  >
                    <CopyIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    title={t("deleteImage")}
                    disabled={img.inUse || deletingId === img.id}
                    onClick={() => handleDelete(img.id)}
                  >
                    {deletingId === img.id ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="truncate text-xs text-muted-foreground" title={img.fileName}>
                {img.fileName}
              </p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams({
                page: String(currentPage - 1),
                ...(query ? { search: query } : {}),
              });
              router.push(`/admin/media?${params.toString()}`);
            }}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams({
                page: String(currentPage + 1),
                ...(query ? { search: query } : {}),
              });
              router.push(`/admin/media?${params.toString()}`);
            }}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
