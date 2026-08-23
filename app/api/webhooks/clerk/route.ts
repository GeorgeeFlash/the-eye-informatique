import { headers } from "next/headers"
import { Webhook } from "svix"
import { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/server/db"
import { serverEnv } from "@/server/env-server"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = serverEnv.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const { type } = evt

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses[0]?.email_address

    if (!email) {
      return new Response("No email on user", { status: 400 })
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || null

    if (type === "user.created") {
      // The very first user in the platform becomes CENTRAL_ADMIN
      const existingCount = await db.user.count()
      const role = existingCount === 0 ? "CENTRAL_ADMIN" : "CUSTOMER"

      await db.user.upsert({
        where: { clerkId: id },
        update: { email, name },
        create: { clerkId: id, email, name, role },
      })
    } else {
      // user.updated — only sync contact details, never change the role
      await db.user.upsert({
        where: { clerkId: id },
        update: { email, name },
        create: { clerkId: id, email, name },
      })
    }
  }

  if (type === "user.deleted") {
    const { id } = evt.data
    if (id) {
      await db.user.deleteMany({ where: { clerkId: id } })
    }
  }

  return new Response("OK", { status: 200 })
}
