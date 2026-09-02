"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ImagePlusIcon,
  XIcon,
  StarIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  CheckIcon,
} from "lucide-react";

export interface UploadedImage {
  id?: string;
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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

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
  const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null);
  const [altDraft, setAltDraft] = useState<string>("");

  const validateFiles = (files: File[]): { valid: File[]; error?: string } => {
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { valid: [], error: t("invalidFileType") };
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: [], error: t("fileTooLarge") };
      }
    }
    return { valid: files };
  };

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;
      const toUpload = fileArray.slice(0, remaining);

      const validation = validateFiles(toUpload);
      if (validation.error) {
        setUploadError(validation.error);
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.set("folder", "products");
        for (const file of validation.valid) {
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

        console.log("New images uploaded:", newImages);

        onChange([...value, ...newImages]);
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxImages, t],
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

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= value.length) return;
      const updated = [...value];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
    },
    [value, onChange],
  );

  const saveAltText = (index: number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], alt: altDraft.trim() };
    onChange(updated);
    setEditingAltIndex(null);
  };

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted/20",
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

              {/* Overlay Top Bar (Primary & Delete) */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                  title={t("setPrimary")}
                  onClick={() => setPrimary(index)}
                >
                  <StarIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      img.isPrimary
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/80",
                    )}
                  />
                </Button>

                {/* Alt Text Popover */}
                <Popover
                  open={editingAltIndex === index}
                  onOpenChange={(open) => {
                    if (open) {
                      setEditingAltIndex(index);
                      setAltDraft(img.alt || "");
                    } else {
                      setEditingAltIndex(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                      title={t("editAltText")}
                    >
                      <FileTextIcon
                        className={cn(
                          "h-3.5 w-3.5",
                          img.alt ? "text-primary" : "text-white/80",
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    className="w-64 p-3 space-y-2 text-xs"
                  >
                    <p className="font-semibold text-foreground">
                      {t("editAltText")}
                    </p>
                    <Input
                      placeholder={t("altTextPlaceholder")}
                      value={altDraft}
                      onChange={(e) => setAltDraft(e.target.value)}
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveAltText(index);
                        }
                      }}
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2.5"
                        onClick={() => saveAltText(index)}
                      >
                        <CheckIcon className="h-3 w-3" />
                        OK
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Reorder Buttons (Move Left / Right) */}
              <div className="absolute inset-x-0 bottom-6 flex justify-between px-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={index === 0}
                  className="h-6 w-6 bg-black/60 text-white hover:bg-black/80 disabled:opacity-0"
                  title={t("moveLeft")}
                  onClick={() => moveImage(index, index - 1)}
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={index === value.length - 1}
                  className="h-6 w-6 bg-black/60 text-white hover:bg-black/80 disabled:opacity-0"
                  title={t("moveRight")}
                  onClick={() => moveImage(index, index + 1)}
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-0.5 text-center text-[10px] font-medium text-primary-foreground">
                  {t("primary")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

