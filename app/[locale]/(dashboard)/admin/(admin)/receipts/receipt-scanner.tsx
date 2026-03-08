"use client"

import { useState, useTransition, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { ScanIcon, SaveIcon, ImageIcon } from "lucide-react"

type ExtractedData = {
  productName: string
  brand?: string
  serialNumber?: string
  purchaseDate?: string
  price?: number
  storeName?: string
}

export function ReceiptScanner() {
  const t = useTranslations("ai")
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<ExtractedData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
      setEditedData(null)
    }
  }

  function handleScan() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error(t("noFile"))
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch("/api/ai/receipt", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        toast.error(t("scanError"))
        return
      }

      const data = await res.json()
      setEditedData(data)
      toast.success(t("scanComplete"))
    })
  }

  function handleSave() {
    if (!editedData) return

    startSaveTransition(async () => {
      const res = await fetch("/api/ai/receipt/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      })

      if (!res.ok) {
        toast.error(t("saveError"))
        return
      }

      toast.success(t("receiptSaved"))
      setEditedData(null)
      setPreviewUrl(null)
      if (fileRef.current) fileRef.current.value = ""
    })
  }

  function updateField(field: keyof ExtractedData, value: string | number) {
    if (!editedData) return
    setEditedData({ ...editedData, [field]: value })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Upload & Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("uploadReceipt")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          {previewUrl && (
            <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isPending || !previewUrl}
            className="w-full"
          >
            {isPending ? (
              <>{t("scanning")}...</>
            ) : (
              <>
                <ScanIcon className="mr-2 size-4" />
                {t("scanReceipt")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Extracted Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("extractedData")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editedData ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <ImageIcon className="size-12" />
              <p className="text-sm">{t("scanToExtract")}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{t("aiGenerated")}</p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>{t("productName")}</Label>
                  <Input
                    value={editedData.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t("brand")}</Label>
                  <Input
                    value={editedData.brand ?? ""}
                    onChange={(e) => updateField("brand", e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t("serialNumber")}</Label>
                  <Input
                    value={editedData.serialNumber ?? ""}
                    onChange={(e) => updateField("serialNumber", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>{t("purchaseDate")}</Label>
                    <Input
                      type="date"
                      value={editedData.purchaseDate ?? ""}
                      onChange={(e) => updateField("purchaseDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("price")}</Label>
                    <Input
                      type="number"
                      value={editedData.price ?? ""}
                      onChange={(e) =>
                        updateField("price", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>{t("storeName")}</Label>
                  <Input
                    value={editedData.storeName ?? ""}
                    onChange={(e) => updateField("storeName", e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                <SaveIcon className="mr-2 size-4" />
                {t("saveReceipt")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
