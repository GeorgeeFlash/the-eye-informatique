"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { UploadIcon } from "lucide-react"

export function UploadForm() {
  const t = useTranslations("ai")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("file") as File | null
    if (!file || file.size === 0) {
      toast.error(t("noFile"))
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/ai/knowledge-base", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        toast.error(t("uploadError"))
        return
      }
      toast.success(t("uploadSuccess"))
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("uploadDocument")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <Input
            ref={inputRef}
            type="file"
            name="file"
            accept=".pdf,.docx,.txt,.md"
            className="max-w-sm"
          />
          <Button type="submit" disabled={isPending}>
            <UploadIcon className="mr-2 size-4" />
            {t("upload")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
