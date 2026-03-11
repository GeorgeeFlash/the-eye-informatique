import { db } from "@/server/db"
import { createNotification } from "@/actions/notification.actions"
import type { NotificationType } from "@/lib/generated/prisma/client"
import type { Locale } from "@/lib/constants"
import { DEFAULT_LOCALE } from "@/lib/constants"

// Statically import both message bundles so they're available at runtime
import en from "@/messages/en.json"
import fr from "@/messages/fr.json"

const bundles: Record<string, typeof en> = { en, fr }

type NotificationMessages = typeof en.notificationMessages

/**
 * Look up the user's preferred locale and send a notification with
 * translated title/body. Falls back to DEFAULT_LOCALE if the locale
 * or key is missing.
 *
 * `params` values are interpolated into the message string using
 * simple {key} replacement (no ICU plurals needed here).
 */
export async function createLocalizedNotification({
  userId,
  type,
  messageKey,
  params = {},
  link,
}: {
  userId: string
  type: NotificationType
  messageKey: keyof NotificationMessages
  params?: Record<string, string | number>
  link?: string
}) {
  // Resolve user preferred locale
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferredLocale: true },
  })
  const locale = (user?.preferredLocale ?? DEFAULT_LOCALE) as Locale
  const messages = (bundles[locale] ?? bundles[DEFAULT_LOCALE])
    .notificationMessages as NotificationMessages

  const template = messages[messageKey] as
    | { title: string; body: string }
    | undefined
  const fallback = (bundles[DEFAULT_LOCALE].notificationMessages as NotificationMessages)[
    messageKey
  ] as { title: string; body: string }

  const raw = template ?? fallback

  const interpolate = (str: string) =>
    str.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`))

  return createNotification({
    userId,
    type,
    title: interpolate(raw.title),
    body: interpolate(raw.body),
    link,
  })
}
