import { z } from "zod"

export const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(3),
  city: z.string().min(2),
  region: z.string().min(2),
  country: z.string().length(2).default("CM"),
})

export const checkoutSchema = z.object({
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  addressId: z.string().cuid().optional(),
  branchId: z.string().cuid().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["MOBILE_MONEY", "CHECKOUT"]),
  phone: z.string().optional(),
  gateway: z.enum(["CM_MTNMOMO", "CM_ORANGE"]).optional(),
  installments: z.boolean().default(false),
}).refine(
  (data) => data.deliveryMethod === "PICKUP" || !!data.addressId,
  { message: "Address required for delivery", path: ["addressId"] },
)

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
export type AddressFormValues = z.infer<typeof addressSchema>
