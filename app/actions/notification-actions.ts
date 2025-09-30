"use server"

import { getCurrentUser } from "@/lib/auth"
import { getUserNotifications, markNotificationAsRead } from "@/lib/database"
import { revalidatePath } from "next/cache"

export async function getMyNotifications() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const notifications = await getUserNotifications(user.id)
    return { success: true, data: notifications }
  } catch (error) {
    console.error("Get notifications error:", error)
    return { success: false, error: "通知情報の取得に失敗しました" }
  }
}

export async function markAsRead(notificationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const notification = await markNotificationAsRead(notificationId)
    revalidatePath("/messages")
    return { success: true, data: notification }
  } catch (error) {
    console.error("Mark as read error:", error)
    return { success: false, error: "通知の更新に失敗しました" }
  }
}
