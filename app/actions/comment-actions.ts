"use server"

import { getCurrentUser } from "@/lib/auth"
import { createComment, getUserComments } from "@/lib/database"
import { revalidatePath } from "next/cache"

export async function submitComment(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const restaurantId = Number.parseInt(formData.get("restaurantId") as string)
  const rating = Number.parseFloat(formData.get("rating") as string)
  const comment = formData.get("comment") as string

  if (!comment.trim()) {
    return { success: false, error: "コメントを入力してください" }
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: "評価は1〜5の範囲で入力してください" }
  }

  try {
    const newComment = await createComment({
      user_id: user.id,
      restaurant_id: restaurantId,
      rating,
      comment: comment.trim(),
    })

    revalidatePath("/messages")
    return { success: true, data: newComment }
  } catch (error) {
    console.error("Submit comment error:", error)
    return { success: false, error: "コメントの投稿に失敗しました" }
  }
}

export async function getMyComments() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const comments = await getUserComments(user.id)
    return { success: true, data: comments }
  } catch (error) {
    console.error("Get comments error:", error)
    return { success: false, error: "コメント情報の取得に失敗しました" }
  }
}
