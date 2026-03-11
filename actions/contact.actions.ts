"use server"

import { db } from "@/server/db"
import { resend, FROM_EMAIL } from "@/server/resend"
import { contactFormSchema } from "@/lib/validators/contact.schema"
import { ContactSubmissionEmail } from "@/components/email/contact-submission"
import { stripHtml } from "@/lib/sanitize"
import { contactFormRateLimit, getIpFromHeaders } from "@/lib/rate-limit"

export async function submitContactForm(formData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  // Rate limit
  const ip = await getIpFromHeaders()
  const { success } = await contactFormRateLimit.limit(ip)
  if (!success) {
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
  try {
    await db.contactSubmission.create({
      data: { name, email, phone: phone || null, subject, message },
    })
  } catch (err) {
    console.error("[contact] Failed to save contact submission:", err)
    return { error: "Unable to save contact request, please try again later" }
  }

  // Send email notification
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.CONTACT_EMAIL ?? "contact@theeyeinformatique.cm",
      replyTo: email,
      subject: `[Contact] ${subject}`,
      react: ContactSubmissionEmail({ name, email, phone, subject, message }),
    })
  } catch (err) {
    // Email failure shouldn't block form submission — record is already saved
    console.error("[contact] Contact email send failed:", err)
  }

  return { success: true }
}
