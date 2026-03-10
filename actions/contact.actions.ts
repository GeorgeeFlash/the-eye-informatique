"use server"

import arcjet, { slidingWindow, request as arcjetRequest } from "@arcjet/next"
import { db } from "@/server/db"
import { resend, FROM_EMAIL } from "@/server/resend"
import { contactFormSchema } from "@/lib/validators/contact.schema"
import { ContactSubmissionEmail } from "@/components/email/contact-submission"
import { stripHtml } from "@/lib/sanitize"

const ajContact = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    slidingWindow({
      mode: "LIVE",
      interval: "1h",
      max: 3,
    }),
  ],
})

export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  // Rate limit
  const req = await arcjetRequest()
  const decision = await ajContact.protect(req)
  if (decision.isDenied()) {
    return { error: "Too many submissions. Please try again later." }
  }

  // Validate
  const parsed = contactFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, phone, subject, message } = {
    name: stripHtml(parsed.data.name),
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: stripHtml(parsed.data.subject),
    message: stripHtml(parsed.data.message),
  }

  // Save to DB
  await db.contactSubmission.create({
    data: { name, email, phone: phone || null, subject, message },
  })

  // Send email notification
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.CONTACT_EMAIL ?? "contact@theeyeinformatique.cm",
      replyTo: email,
      subject: `[Contact] ${subject}`,
      react: ContactSubmissionEmail({ name, email, phone, subject, message }),
    })
  } catch {
    // Email failure shouldn't block form submission — record is already saved
  }

  return { success: true }
}
