"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { AlbumItem, AssetItem } from "@/lib/types"

export function useAlbums(isActive: boolean) {
  const router = useRouter()
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsError, setAlbumsError] = useState<string | null>(null)
  const [albumAssetsMap, setAlbumAssetsMap] = useState<Record<string, AssetItem[]>>({})
  
  // Album like/bookmark state
  const [albumLikedSet, setAlbumLikedSet] = useState<Set<string>>(new Set())
  const [albumBookmarkedSet, setAlbumBookmarkedSet] = useState<Set<string>>(new Set())
  
  // Album viewer state
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const [albumAssets, setAlbumAssets] = useState<AssetItem[]>([])
  const [albumIndex, setAlbumIndex] = useState(0)
  const [albumLoading, setAlbumLoading] = useState(false)

  const fetchAlbums = async (limit: number = 10, offset: number = 0) => {
    const params = new URLSearchParams()
    params.set("limit", limit.toString())
    params.set("offset", offset.toString())
    const res = await fetch(`/api/guidebook/albums?${params.toString()}`, { cache: "no-store" })
    if (!res.ok) throw new Error("アルバムの取得に失敗しました")
    const json = await res.json().catch(() => ({}))
    return Array.isArray(json?.items) ? json.items : []
  }

  const fetchAlbumAssets = async (albumId: string): Promise<AssetItem[]> => {
    const res = await fetch(`/api/guidebook/albums/${albumId}/assets`, { cache: 'no-store' })
    if (!res.ok) throw new Error('アルバムの取得に失敗しました')
    const json = await res.json().catch(() => ({}))
    return json?.items ?? []
  }

  const prefetchAlbumAssets = async (albumList: AlbumItem[], isCancelled?: () => boolean) => {
    if (!albumList || albumList.length === 0) {
      setAlbumAssetsMap({})
      return
    }
    const entries = await Promise.all(
      albumList.map(async (album) => {
        try {
          const items = await fetchAlbumAssets(album.id)
          return [album.id, items] as const
        } catch {
          return [album.id, []] as const
        }
      })
    )
    if (isCancelled?.()) return
    setAlbumAssetsMap(() => {
      const next: Record<string, AssetItem[]> = {}
      entries.forEach(([id, assets]) => {
        next[id] = Array.from(assets)
      })
      return next
    })
  }

  // Fetch guidebook albums when tab is active
  useEffect(() => {
    if (!isActive) return
    
    let aborted = false
    let cancelled = false
    ;(async () => {
      try {
        setAlbumsLoading(true)
        setAlbumsError(null)
        const items = await fetchAlbums()
        if (aborted) return
        setAlbums(items)
        await prefetchAlbumAssets(items, () => cancelled || aborted)
      } catch (e) {
        if (aborted) return
        setAlbums([])
        setAlbumsError(e instanceof Error ? e.message : '取得に失敗しました')
      } finally {
        if (!aborted) setAlbumsLoading(false)
      }
    })()

    return () => {
      aborted = true
      cancelled = true
    }
  }, [isActive])

  // Fetch album like/bookmark states for current user
  useEffect(() => {
    ;(async () => {
      try {
        if (!isActive) return
        if (!albums || albums.length === 0) { 
          setAlbumLikedSet(new Set())
          setAlbumBookmarkedSet(new Set())
          return
        }
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setAlbumLikedSet(new Set())
          setAlbumBookmarkedSet(new Set())
          return
        }
        
        const albumIds = albums.map((a) => a.id)
        const [likedRes, savedRes] = await Promise.all([
          supabase.from("photo_album_likes").select("album_id").eq("user_id", user.id).in("album_id", albumIds),
          supabase.from("photo_album_bookmarks").select("album_id").eq("user_id", user.id).in("album_id", albumIds),
        ])
        
        if (!likedRes.error && likedRes.data) {
          setAlbumLikedSet(new Set((likedRes.data as any[]).map((r) => r.album_id)))
        } else {
          setAlbumLikedSet(new Set())
        }
        
        if (!savedRes.error && savedRes.data) {
          setAlbumBookmarkedSet(new Set((savedRes.data as any[]).map((r) => r.album_id)))
        } else {
          setAlbumBookmarkedSet(new Set())
        }
      } catch {
        setAlbumLikedSet(new Set())
        setAlbumBookmarkedSet(new Set())
      }
    })()
  }, [isActive, albums])

  async function toggleAlbumLike(albumId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        router.push("/auth/login")
        return
      }
      
      const wasLiked = albumLikedSet.has(albumId)
      setAlbumLikedSet((prev) => {
        const s = new Set(prev)
        wasLiked ? s.delete(albumId) : s.add(albumId)
        return s
      })
      
      await fetch(`/api/guidebook/albums/${albumId}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    } catch {
      setAlbumLikedSet((prev) => {
        const s = new Set(prev)
        if (s.has(albumId)) s.delete(albumId)
        else s.add(albumId)
        return s
      })
    }
  }

  async function toggleAlbumBookmark(albumId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        router.push("/auth/login")
        return
      }
      
      const wasSaved = albumBookmarkedSet.has(albumId)
      setAlbumBookmarkedSet((prev) => {
        const s = new Set(prev)
        wasSaved ? s.delete(albumId) : s.add(albumId)
        return s
      })
      
      await fetch(`/api/guidebook/albums/${albumId}/bookmarks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    } catch {
      setAlbumBookmarkedSet((prev) => {
        const s = new Set(prev)
        if (s.has(albumId)) s.delete(albumId)
        else s.add(albumId)
        return s
      })
    }
  }

  async function openAlbum(albumId: string) {
    try {
      setAlbumLoading(true)
      const cached = albumAssetsMap[albumId]
      if (cached) {
        setAlbumAssets(cached)
        setAlbumIndex(0)
        setOpenAlbumId(albumId)
        return
      }
      const items = await fetchAlbumAssets(albumId)
      setAlbumAssets(items)
      setAlbumIndex(0)
      setOpenAlbumId(albumId)
      setAlbumAssetsMap((prev) => ({ ...prev, [albumId]: items }))
    } catch (e) {
      console.error("open album error", e)
      setAlbumAssets([])
      setOpenAlbumId(albumId)
    } finally {
      setAlbumLoading(false)
    }
  }

  async function refreshAlbums() {
    try {
      setAlbumsLoading(true)
      setAlbumsError(null)
      const items = await fetchAlbums(10, 0)
      setAlbums(items)
      await prefetchAlbumAssets(items)
    } catch (e) {
      setAlbums([])
      setAlbumsError(e instanceof Error ? e.message : '取得に失敗しました')
    } finally {
      setAlbumsLoading(false)
    }
  }

  function closeAlbum() {
    setOpenAlbumId(null)
    setAlbumAssets([])
    setAlbumIndex(0)
  }

  return {
    albums,
    albumsLoading,
    albumsError,
    albumLikedSet,
    albumBookmarkedSet,
    openAlbumId,
    albumAssets,
    albumIndex,
    albumLoading,
    setAlbumIndex,
    toggleAlbumLike,
    toggleAlbumBookmark,
    openAlbum,
    closeAlbum,
    refreshAlbums,
    fetchAlbums,
  }
}
