"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function toggleBookmark(restaurantId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId)
      .single()

    if (existing) {
      // Remove bookmark
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("restaurant_id", restaurantId)
    } else {
      // Add bookmark
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        restaurant_id: restaurantId,
      })
    }

    revalidatePath("/bookmarks")
    return { success: true, bookmarked: !existing }
  } catch (error) {
    console.error("Bookmark error:", error)
    return { success: false, error: "ブックマークの更新に失敗しました" }
  }
}

export async function getUserBookmarks() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const { data } = await supabase
      .from("bookmarks")
      .select(`
        *,
        restaurants (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return { success: true, data }
  } catch (error) {
    console.error("Get bookmarks error:", error)
    return { success: false, error: "ブックマークの取得に失敗しました" }
  }
}
