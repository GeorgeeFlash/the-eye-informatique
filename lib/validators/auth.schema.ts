import { z } from "zod"

export const signUpSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^(\+237|237)?[6][5-9]\d{7}$/, "Enter a valid Cameroon mobile number")
    .optional(),
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const profileSchema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .regex(/^(\+237|237)?[6][5-9]\d{7}$/, "Enter a valid Cameroon mobile number")
    .optional()
    .or(z.literal("")),
  preferredLocale: z.enum(["en", "fr"]).default("en"),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>
export type SignInFormValues = z.infer<typeof signInSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
