"use client"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRepairTicket } from "@/actions/repair.actions"
import {
  createRepairTicketSchema,
  type CreateRepairTicketValues,
} from "@/lib/validators/repair.schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2Icon, PaperclipIcon, XIcon } from "lucide-react"
import { useRef, useState, useTransition } from "react"

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"

interface GuaranteeOption {
  id: string
  label: string
  isActive: boolean
}

interface NewRepairFormProps {
  guaranteeOptions: GuaranteeOption[]
}

export function NewRepairForm({ guaranteeOptions }: NewRepairFormProps) {
  const router = useRouter()
  const t = useTranslations("repairs")
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateRepairTicketValues>({
    resolver: zodResolver(createRepairTicketSchema) as never,
    defaultValues: {
      requestType: "REPAIR",
      issueDescription: "",
      priority: "MEDIUM",
    },
  })

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_FILES - selectedFiles.length
    const toAdd = files.slice(0, remaining)

    for (const file of toAdd) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("fileTooLarge", { name: file.name }))
        return
      }
    }

    setSelectedFiles((prev) => [...prev, ...toAdd])
    // Reset input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function onSubmit(values: CreateRepairTicketValues) {
    setServerError("")
    startTransition(async () => {
      // Upload files first if any
      let uploadedFiles: { url: string; fileName: string; size: number; mimeType: string }[] = []

      if (selectedFiles.length > 0) {
        const formData = new FormData()
        for (const file of selectedFiles) {
          formData.append("files", file)
        }

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          setServerError(err.error ?? t("uploadError"))
          return
        }

        const data = await uploadRes.json()
        uploadedFiles = data.files
      }

      const result = await createRepairTicket(values, uploadedFiles.length > 0 ? uploadedFiles : undefined)
      if (!("success" in result)) {
        const err = result.error
        if (typeof err === "string") {
          setServerError(err)
        } else {
          toast.error(t("validationError"))
        }
        return
      }
      toast.success(t("ticketCreated"))
      router.push("/dashboard/repairs")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t("requestDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("requestType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REPAIR">{t("type_REPAIR")}</SelectItem>
                      <SelectItem value="EXCHANGE">{t("type_EXCHANGE")}</SelectItem>
                      <SelectItem value="RETURN">{t("type_RETURN")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {guaranteeOptions.length > 0 && (
              <FormField
                control={form.control}
                name="guaranteeCardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("guaranteeCard")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectGuarantee")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {guaranteeOptions
                          .filter((g) => g.isActive)
                          .map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("priority")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">{t("priority_LOW")}</SelectItem>
                      <SelectItem value="MEDIUM">{t("priority_MEDIUM")}</SelectItem>
                      <SelectItem value="HIGH">{t("priority_HIGH")}</SelectItem>
                      <SelectItem value="URGENT">{t("priority_URGENT")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("issueDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder={t("issueDescriptionPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AC-M4.1-3: File attachments (up to 5 files, max 10 MB each) */}
            <div className="space-y-2">
              <FormLabel>{t("attachments")}</FormLabel>
              <FormDescription>{t("attachmentsDescription")}</FormDescription>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <PaperclipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(index)}
                        disabled={isPending}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedFiles.length < MAX_FILES && (
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    onChange={handleFileSelect}
                    disabled={isPending}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {t("submit")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
