"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * 楽観的更新付きいいねhook（videos / video_likes 前提）
 */
export function useLike(videoId: string, initialCount = 0) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [pending, setPending] = useState(false)

  const fetchLikeStatus = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      const { count } = await supabase
        .from("video_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId)
      setLikeCount(count ?? 0)

      if (!userId) {
        setIsLiked(false)
        return
      }

      const { data, error } = await supabase
        .from("video_likes")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .limit(1)
      if (error) throw error
      setIsLiked((data?.length || 0) > 0)
    } catch (e) {
      console.warn("fetchLikeStatus error", e)
    }
  }, [videoId])

  const toggleLike = useCallback(async () => {
    if (pending) return
    setPending(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) {
      setPending(false)
      return { needLogin: true }
    }

    const wasLiked = isLiked
    const prevCount = likeCount
    const nextLiked = !wasLiked
    setIsLiked(nextLiked)
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)))

    try {
      if (nextLiked) {
        const { error } = await supabase.from("video_likes").upsert({ video_id: videoId, user_id: userId })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", userId)
        if (error) throw error
      }
    } catch (e) {
      console.warn("toggleLike error", e)
      setIsLiked(wasLiked)
      setLikeCount(prevCount)
      return { error: true }
    } finally {
      setPending(false)
    }
    return { needLogin: false }
  }, [pending, isLiked, videoId, likeCount])

  useEffect(() => {
    fetchLikeStatus()
  }, [fetchLikeStatus])

  return {
    isLiked,
    likeCount,
    pending,
    toggleLike,
    refetch: fetchLikeStatus,
  }
}
