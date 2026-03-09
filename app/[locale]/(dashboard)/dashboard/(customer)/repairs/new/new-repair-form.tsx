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
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"

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

  const form = useForm<CreateRepairTicketValues>({
    resolver: zodResolver(createRepairTicketSchema) as never,
    defaultValues: {
      requestType: "REPAIR",
      issueDescription: "",
      priority: "MEDIUM",
    },
  })

  function onSubmit(values: CreateRepairTicketValues) {
    setServerError("")
    startTransition(async () => {
      const result = await createRepairTicket(values)
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
