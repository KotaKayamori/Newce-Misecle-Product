"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SupabaseVideoRow, AlbumItem, SearchResults } from "@/lib/types"
import { deriveAlbumCoverUrl } from "@/lib/media"

export function useSearchVideos() {
  const [searchResults, setSearchResults] = useState<SearchResults>({ videos: [], albums: [] })
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
      // 動画検索
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("id, owner_id, playback_url, storage_path, title, caption, created_at, video_likes(count), store_1_name, store_1_tel, store_1_tabelog, store_2_name, store_2_tel, store_2_tabelog, store_3_name, store_3_tel, store_3_tabelog")
        .or(`title.ilike.${pattern},caption.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(40)

      // アルバム検索
      const { data: albumData, error: albumError } = await supabase
        .from("photo_albums")
        .select("id, title, caption, owner_id, cover_path, created_at")
        .or(`title.ilike.${pattern},caption.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (videoError) throw videoError
      if (albumError) throw albumError

      const videos = (videoData as SupabaseVideoRow[]) || []
      // owner_id一覧を収集して user_profiles をまとめ取得
      const albumsRaw = (albumData as any[]) || []
      const ownerIds = Array.from(
        new Set(albumsRaw.map((a) => a.owner_id).filter(Boolean))
      ) as string[]

      let ownersById: Record<string, any> = {}
      if (ownerIds.length > 0) {
        const { data: ownerRows, error: ownerErr } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ownerIds)

        if (!ownerErr && ownerRows) {
          ownerRows.forEach((o: any) => {
            ownersById[o.id] = o
          })
        }
      }

      // AlbumItem型に変換（user_profiles が見つかれば詳細を埋める）
      const albums: AlbumItem[] = albumsRaw.map((a) => ({
        id: a.id,
        title: a.title ?? null,
        description: a.caption ?? null,
        coverUrl: deriveAlbumCoverUrl(a.cover_path) || null,
        createdAt: a.created_at ?? null,
        owner: a.owner_id
          ? ownersById[a.owner_id]
            ? {
                id: ownersById[a.owner_id].id,
                username: ownersById[a.owner_id].username ?? null,
                displayName: ownersById[a.owner_id].display_name ?? null,
                avatarUrl: ownersById[a.owner_id].avatar_url ?? null,
              }
            : { id: a.owner_id } // user_profiles が見つからなければ id のみ
          : null,
      }))

      setSearchResults({ videos, albums })
      setDidSearch(true)

      return { videos, albums, error: null }
    } catch (e: any) {
      console.warn("search error", e)
      setSearchError(e?.message ?? "検索に失敗しました")
      return { videos: [], albums: [], error: e?.message ?? "検索に失敗しました" }
    } finally {
      setSearchLoading(false)
    }
  }

  function clearSearch() {
    setSearchResults({ videos: [], albums: [] })
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
