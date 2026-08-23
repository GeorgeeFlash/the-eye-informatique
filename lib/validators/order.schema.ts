import { z } from "zod"

export const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(3),
  city: z.string().min(2),
  region: z.string().min(2),
  country: z.string().length(2).default("CM"),
})

export const cartLineItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const checkoutFormSchema = z.object({
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  addressId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["MOBILE_MONEY"]),
  installments: z.boolean(),
})

export const checkoutSchema = checkoutFormSchema.extend({
  items: z.array(cartLineItemSchema).min(1, "Cart is empty"),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>
export type AddressFormValues = z.infer<typeof addressSchema>
export type CartLineItem = z.infer<typeof cartLineItemSchema>
