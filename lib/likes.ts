"use client"

import { supabase } from "@/lib/supabase"

export async function toggleLike(videoId: string, currentLiked: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { needLogin: true as const }

  if (!currentLiked) {
    const { error } = await supabase
      .from("video_likes")
      .insert({ video_id: videoId, user_id: user.id })
    // 23505 = unique violation (already liked). Treat as success (idempotent)
    if (error && (error as any).code !== "23505") throw error
    return { liked: true as const }
  } else {
    const { error } = await supabase
      .from("video_likes")
      .delete()
      .eq("video_id", videoId)
      .eq("user_id", user.id)
    if (error) throw error
    return { liked: false as const }
  }
}

