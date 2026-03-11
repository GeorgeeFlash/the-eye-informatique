"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImagePlusIcon,
  XIcon,
  StarIcon,
  Loader2Icon,
  GripVerticalIcon,
} from "lucide-react";

export interface UploadedImage {
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  error?: string;
}

export function ImageUploader({
  value,
  onChange,
  maxImages = 10,
  error,
}: ImageUploaderProps) {
  const t = useTranslations("productForm");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;
      const toUpload = fileArray.slice(0, remaining);

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.set("folder", "products");
        for (const file of toUpload) {
          formData.append("files", file);
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          setUploadError(json.error ?? "Upload failed");
          return;
        }

        const newImages: UploadedImage[] = (
          json.files as { url: string; fileName: string }[]
        ).map((f, i) => ({
          url: f.url,
          alt: "",
          sortOrder: value.length + i,
          isPrimary: value.length === 0 && i === 0,
        }));

        onChange([...value, ...newImages]);
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxImages],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        uploadFiles(e.target.files);
        e.target.value = "";
      }
    },
    [uploadFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  const removeImage = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index);
      // If we removed the primary image, make the first one primary
      if (value[index].isPrimary && updated.length > 0) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      // Recompute sort order
      onChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
    },
    [value, onChange],
  );

  const setPrimary = useCallback(
    (index: number) => {
      onChange(value.map((img, i) => ({ ...img, isPrimary: i === index })));
    },
    [value, onChange],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          isUploading && "pointer-events-none opacity-60",
          value.length >= maxImages && "pointer-events-none opacity-40",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlusIcon className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {isUploading
            ? t("uploading")
            : value.length >= maxImages
              ? t("maxImagesReached")
              : t("dropImages")}
        </p>
        {value.length < maxImages && !isUploading && (
          <>
            <label className="mt-2 cursor-pointer">
              <span className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                {t("browseFiles")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("imageRequirements")}
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {(uploadError || error) && (
        <p className="text-sm text-destructive">{uploadError ?? error}</p>
      )}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((img, index) => (
            <div
              key={img.url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border",
                img.isPrimary && "ring-2 ring-primary",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  title={t("setPrimary")}
                  onClick={() => setPrimary(index)}
                >
                  <StarIcon
                    className={cn(
                      "h-4 w-4",
                      img.isPrimary && "fill-yellow-400 text-yellow-400",
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-0.5 text-center text-xs font-medium text-primary-foreground">
                  {t("primary")}
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100">
                <GripVerticalIcon className="h-4 w-4 text-white drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
