"use server"

import { db } from "@/server/db"

/**
 * Read a single setting value by key. Returns the raw JSON value, or the
 * provided `defaultValue` when no row exists.
 */
export async function getSetting<T = unknown>(
  key: string,
  defaultValue: T,
): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } })
  if (!row) return defaultValue
  return row.value as T
}

/**
 * Upsert a setting (admin-only in practice; caller must enforce auth).
 */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await db.setting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  })
}
