"use client"

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  addressSchema,
  type AddressFormValues,
} from "@/lib/validators/order.schema"
import { addAddress, updateAddress } from "@/actions/address.actions"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { useTransition } from "react"

interface AddressFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAddress?: {
    id: string
    label: string | null
    street: string
    city: string
    region: string
    country: string
  } | null
}

export function AddressFormDialog({
  open,
  onOpenChange,
  editingAddress,
}: AddressFormDialogProps) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as never,
    defaultValues: editingAddress
      ? {
          label: editingAddress.label ?? "",
          street: editingAddress.street,
          city: editingAddress.city,
          region: editingAddress.region,
          country: editingAddress.country,
        }
      : {
          label: "",
          street: "",
          city: "",
          region: "",
          country: "CM",
        },
  })

  function onSubmit(values: AddressFormValues) {
    startTransition(async () => {
      const result = editingAddress
        ? await updateAddress(editingAddress.id, values)
        : await addAddress(values)

      if ("error" in result) {
        if (typeof result.error === "string") {
          toast.error(result.error)
        } else {
          toast.error(t("addressError"))
        }
        return
      }

      toast.success(editingAddress ? t("addressUpdated") : t("addressAdded"))
      form.reset()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingAddress ? t("editAddress") : t("addAddress")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addressLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("addressLabelPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("street")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("streetPlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("region")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("cancelAddress")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingAddress ? t("saveAddress") : t("addAddress")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
