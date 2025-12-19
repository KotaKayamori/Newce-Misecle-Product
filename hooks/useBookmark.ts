"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * videos / video_bookmarks 用ブックマークhook（Setを返却し既存インターフェース互換）
 */
export function useBookmark() {
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)

  const fetchBookmarkStatus = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        setBookmarkedVideoIds(new Set())
        return
      }
      const { data, error } = await supabase
        .from("video_bookmarks")
        .select("video_id")
        .eq("user_id", userId)
      if (error) throw error
      const ids = new Set<string>((data ?? []).map((r: any) => r.video_id))
      setBookmarkedVideoIds(ids)
    } catch (e) {
      console.warn("fetchBookmarkStatus error", e)
    }
  }, [])

  const toggleBookmark = useCallback(async (videoId: string) => {
    if (pending) return
    setPending(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) {
      setPending(false)
      return { needLogin: true }
    }

    const wasBookmarked = bookmarkedVideoIds.has(videoId)
    setBookmarkedVideoIds((prev) => {
      const next = new Set(prev)
      if (wasBookmarked) next.delete(videoId)
      else next.add(videoId)
      return next
    })

    try {
      if (wasBookmarked) {
        const { error } = await supabase.from("video_bookmarks").delete().eq("video_id", videoId).eq("user_id", userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("video_bookmarks").upsert({ video_id: videoId, user_id: userId })
        if (error) throw error
      }
    } catch (e) {
      console.warn("toggleBookmark error", e)
      // rollback
      setBookmarkedVideoIds((prev) => {
        const next = new Set(prev)
        if (wasBookmarked) next.add(videoId)
        else next.delete(videoId)
        return next
      })
      return { error: true }
    } finally {
      setPending(false)
    }
    return { needLogin: false }
  }, [pending, bookmarkedVideoIds])

  useEffect(() => {
    fetchBookmarkStatus()
  }, [fetchBookmarkStatus])

  return {
    bookmarkedVideoIds,
    pending,
    toggleBookmark,
    refetch: fetchBookmarkStatus,
  }
}
