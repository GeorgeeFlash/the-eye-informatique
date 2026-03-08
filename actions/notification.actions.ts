"use server"

import { db } from "@/server/db"
import { revalidatePath } from "next/cache"

export async function markNotificationRead(notificationId: string) {
  // TODO: Set Notification.read = true
  void db
  void notificationId
  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true }
}

export async function markAllNotificationsRead(userId: string) {
  // TODO: Bulk update all unread notifications for user
  void db
  void userId
  revalidatePath("/[locale]/(dashboard)", "layout")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  // TODO: Delete notification record
  void db
  void notificationId
  return { success: true }
}
