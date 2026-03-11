"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImagePlusIcon, XIcon, Loader2Icon } from "lucide-react";

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

export function CoverImageUploader({
  value,
  onChange,
}: CoverImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.set("folder", "blog");
        formData.append("files", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          setUploadError(json.error ?? "Upload failed");
          return;
        }

        onChange((json.files as { url: string }[])[0].url);
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange],
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-md border">
          <Image
            src={value}
            alt="Cover image"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => onChange("")}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            isUploading && "pointer-events-none opacity-60",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2Icon className="size-7 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlusIcon className="size-7 text-muted-foreground" />
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {isUploading ? "Uploading…" : "Drop an image or"}
          </p>
          {!isUploading && (
            <label className="mt-1 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline">
              browse files
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          )}
        </div>
      )}

      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

      {/* Allow pasting a URL directly as a fallback */}
      <Input
        type="url"
        placeholder="Or paste an image URL…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
