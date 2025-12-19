"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SupabaseVideoRow } from "../types"

export function useSearchVideos() {
  const [searchResults, setSearchResults] = useState<SupabaseVideoRow[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [didSearch, setDidSearch] = useState(false)

  function escapeIlike(input: string) {
    return input.replace(/[%_]/g, "\\$&")
  }

  async function performSearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return

    setSearchLoading(true)
    setSearchError(null)

    try {
      const pattern = `%${escapeIlike(trimmed)}%`
      const { data, error } = await supabase
        .from("videos")
        .select("id, owner_id, playback_url, storage_path, title, caption, created_at, video_likes(count), store_1_name, store_1_tel, store_1_tabelog, store_2_name, store_2_tel, store_2_tabelog, store_3_name, store_3_tel, store_3_tabelog")
        .or(`title.ilike.${pattern},caption.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(40)

      if (error) throw error
      const arr = (data as SupabaseVideoRow[]) || []
      setSearchResults(arr)
      setDidSearch(true)

      return { videos: arr, error: null }
    } catch (e: any) {
      console.warn("search error", e)
      setSearchError(e?.message ?? "検索に失敗しました")
      return { videos: [], error: e?.message ?? "検索に失敗しました" }
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setSearchResults([])
    setSearchError(null)
    setDidSearch(false)
  }

  return {
    searchResults,
    searchLoading,
    searchError,
    didSearch,
    performSearch,
    clearSearch,
  }
}
