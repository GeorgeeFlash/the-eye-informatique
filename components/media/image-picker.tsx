"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImagePlusIcon,
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

interface ImagePickerProps {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const t = useTranslations("media");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadImages(
    query: string,
    append = false,
    pageCursor: string | null = null,
  ) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ take: "48" });
      if (query) params.set("search", query);
      if (pageCursor) params.set("cursor", pageCursor);
      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load images");
      const json = (await res.json()) as {
        images: MediaImage[];
        nextCursor: string | null;
      };
      setImages((prev) => (append ? [...prev, ...json.images] : json.images));
      setHasMore(!!json.nextCursor);
      setCursor(json.nextCursor);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setCursor(null);
    void loadImages(search);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setCursor(null);
    void loadImages(search);
  }

  function handleLoadMore() {
    if (!loading && hasMore) {
      void loadImages(search, true, cursor);
    }
  }

  function handleSelect(url: string) {
    onChange(url);
    setOpen(false);
  }

  function handleClear() {
    onChange(undefined);
    setOpen(false);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("folder", "media");
      formData.append("files", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(t("uploadFailed"));
        return;
      }

      const uploaded = json.files as { url: string }[];
      onChange(uploaded[0]!.url);
      setOpen(false);
    } catch {
      setError(t("uploadFailed"));
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

  return (
    <div className="space-y-2">
      {value ? (
        <div className="group relative size-24 overflow-hidden rounded-lg border">
          <Image
            src={value}
            alt="Selected image"
            fill
            className="object-cover"
            sizes="96px"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 group-focus-within:bg-black/40 group-focus-within:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleOpen}
              aria-label={t("changeImage")}
            >
              <UploadIcon className="size-3" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
              aria-label={t("removeImage")}
            >
              <TrashIcon className="size-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="size-24 flex-col gap-1"
          onClick={handleOpen}
        >
          <ImagePlusIcon className="size-5" />
          <span className="text-xs">{t("selectImage")}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("selectImage")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="outline">
                {t("searchPlaceholder")}
              </Button>
            </form>

            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors",
                uploading && "pointer-events-none opacity-60",
              )}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={handleDrop}
            >
              {uploading ? (
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <UploadIcon className="size-6 text-muted-foreground" />
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {uploading ? t("uploading") : t("uploadNew")}
              </p>
              {!uploading && (
                <label className="mt-1 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {t("browseFiles")}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noImages")}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.map((img) => (
                    <MediaThumbnail
                      key={img.id}
                      src={img.url}
                      alt={img.fileName}
                      selected={img.url === value}
                      inUse={img.inUse}
                      onClick={() => handleSelect(img.url)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {t("loadMore")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
