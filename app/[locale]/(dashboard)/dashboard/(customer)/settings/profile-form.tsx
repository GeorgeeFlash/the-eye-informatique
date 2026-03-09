"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileSchema } from "@/lib/validators/auth.schema"
import { updateProfile } from "@/actions/user.actions"
import { useRouter } from "@/i18n/navigation"

type ProfileFormValues = {
  name: string
  phone?: string
  preferredLocale: "en" | "fr"
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { toast } from "sonner"

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: ProfileFormValues
}) {
  const t = useTranslations("settings")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues,
  })

  function onSubmit(data: ProfileFormValues) {
    startTransition(async () => {
      const result = await updateProfile(data)
      if (result.success) {
        toast.success(t("profileUpdated"))
        router.refresh()
      } else {
        toast.error(t("profileError"))
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+237 6XX XXX XXX" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredLocale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("language")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  )
}
