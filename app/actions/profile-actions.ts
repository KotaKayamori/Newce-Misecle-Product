"use server"

import { getCurrentUser } from "@/lib/auth"
import { getUserProfile, updateUserProfile, getUserStats } from "@/lib/database"
import { revalidatePath } from "next/cache"

export async function getMyProfile() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const profile = await getUserProfile(user.id)
    const stats = await getUserStats(user.id)

    return {
      success: true,
      data: {
        ...profile,
        email: user.email,
        stats,
      },
    }
  } catch (error) {
    console.error("Get profile error:", error)
    return { success: false, error: "プロフィール情報の取得に失敗しました" }
  }
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const name = formData.get("name") as string

  if (!name.trim()) {
    return { success: false, error: "名前を入力してください" }
  }

  try {
    const profile = await updateUserProfile(user.id, {
      name: name.trim(),
    })

    revalidatePath("/profile")
    return { success: true, data: profile }
  } catch (error) {
    console.error("Update profile error:", error)
    return { success: false, error: "プロフィールの更新に失敗しました" }
  }
}
