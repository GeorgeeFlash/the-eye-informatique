"use client"

import { useTranslations } from "next-intl"
import { lookupGuarantee } from "@/actions/guarantee.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ShieldCheckIcon, SearchIcon, Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"

type LookupResult = Awaited<ReturnType<typeof lookupGuarantee>>

export function GuaranteeLookupForm() {
  const t = useTranslations("guarantee")
  const [isPending, startTransition] = useTransition()
  const [serial, setSerial] = useState("")
  const [result, setResult] = useState<LookupResult | undefined>()
  const [searched, setSearched] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!serial.trim()) return

    startTransition(async () => {
      const data = await lookupGuarantee(serial.trim())
      setResult(data)
      setSearched(true)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="serial" className="sr-only">
                {t("serialNumber")}
              </Label>
              <Input
                id="serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder={t("serialPlaceholder")}
              />
            </div>
            <Button type="submit" disabled={isPending || !serial.trim()}>
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SearchIcon className="size-4" />
              )}
              <span className="ml-2">{t("search")}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && !result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <ShieldCheckIcon className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t("notFound")}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-5" />
                {t("guaranteeDetails")}
              </CardTitle>
              <Badge variant={result.isActive ? "default" : "destructive"}>
                {result.isActive ? t("active") : t("expired")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("product")}</span>
              <span className="font-medium">{result.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("serialNumber")}</span>
              <span className="font-mono">{result.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("warranty")}</span>
              <span>
                {result.warrantyMonths} {t("months")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("purchaseDate")}</span>
              <span>
                {new Date(result.purchaseDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("expiresAt")}</span>
              <span>
                {new Date(result.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
