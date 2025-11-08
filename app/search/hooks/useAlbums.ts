"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { AlbumItem, AssetItem } from "../types"

export function useAlbums(isActive: boolean) {
  const router = useRouter()
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsError, setAlbumsError] = useState<string | null>(null)
  
  // Album like/bookmark state
  const [albumLikedSet, setAlbumLikedSet] = useState<Set<string>>(new Set())
  const [albumBookmarkedSet, setAlbumBookmarkedSet] = useState<Set<string>>(new Set())
  
  // Album viewer state
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const [albumAssets, setAlbumAssets] = useState<AssetItem[]>([])
  const [albumIndex, setAlbumIndex] = useState(0)
  const [albumLoading, setAlbumLoading] = useState(false)

  // Fetch guidebook albums when tab is active
  useEffect(() => {
    if (!isActive) return
    
    let aborted = false
    ;(async () => {
      try {
        setAlbumsLoading(true)
        setAlbumsError(null)
        const res = await fetch('/api/guidebook/albums?random=10', { cache: 'no-store' })
        if (!res.ok) throw new Error('アルバムの取得に失敗しました')
        const json = await res.json().catch(() => ({}))
        if (aborted) return
        setAlbums(Array.isArray(json?.items) ? json.items : [])
      } catch (e) {
        if (aborted) return
        setAlbums([])
        setAlbumsError(e instanceof Error ? e.message : '取得に失敗しました')
      } finally {
        if (!aborted) setAlbumsLoading(false)
      }
    })()
    
    return () => { aborted = true }
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
      const res = await fetch(`/api/guidebook/albums/${albumId}/assets`, { cache: "no-store" })
      if (!res.ok) throw new Error("アルバムの取得に失敗しました")
      const json = await res.json().catch(() => ({}))
      const items: AssetItem[] = json?.items ?? []
      setAlbumAssets(items)
      setAlbumIndex(0)
      setOpenAlbumId(albumId)
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
      const res = await fetch('/api/guidebook/albums?random=10', { cache: 'no-store' })
      if (!res.ok) throw new Error('アルバムの取得に失敗しました')
      const json = await res.json().catch(() => ({}))
      setAlbums(Array.isArray(json?.items) ? json.items : [])
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
  }
}


