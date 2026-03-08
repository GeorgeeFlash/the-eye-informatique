"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { checkoutSchema } from "@/lib/validators/order.schema"
import { createOrder } from "@/actions/order.actions"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
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

type CheckoutFormValues = {
  deliveryMethod: "PICKUP" | "DELIVERY"
  paymentMethod: "MOBILE_MONEY" | "CHECKOUT"
  installments: boolean
  addressId?: string
  branchId?: string
  notes?: string
  phone?: string
  gateway?: "CM_MTNMOMO" | "CM_ORANGE"
}

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const { items, clearCart } = useCart()

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as never,
    defaultValues: {
      deliveryMethod: "PICKUP",
      paymentMethod: "MOBILE_MONEY",
      installments: false,
    },
  })

  function onSubmit(data: CheckoutFormValues) {
    startTransition(async () => {
      const result = await createOrder(data)
      if ("error" in result) {
        toast.error("Erreur lors de la commande")
        return
      }
      clearCart()
      toast.success("Commande créée avec succès")
      // TODO: Redirect to PayUnit checkout or order confirmation
    })
  }

  void items

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="deliveryMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mode de livraison</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le mode de livraison" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PICKUP">Retrait en boutique</SelectItem>
                  <SelectItem value="DELIVERY">Livraison à domicile</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Conditional address fields when DELIVERY is selected */}
        {/* TODO: Payment method selection (PayUnit gateways) */}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Traitement..." : "Confirmer la commande"}
        </Button>
      </form>
    </Form>
  )
}
