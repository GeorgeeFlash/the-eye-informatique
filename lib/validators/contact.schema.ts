import { z } from "zod"

const CM_PHONE_REGEX = /^(\+237|237)?[6][2-9]\d{7}$/

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(CM_PHONE_REGEX, "Invalid Cameroon phone number")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(3, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
