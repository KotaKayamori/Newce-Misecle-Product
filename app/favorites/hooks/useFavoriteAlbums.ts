"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { AlbumRow, OwnerProfile } from "@/lib/types"

export function useFavoriteAlbums() {
  const router = useRouter()

  const [likedAlbums, setLikedAlbums] = useState<AlbumRow[] | null>(null)
  const [savedAlbums, setSavedAlbums] = useState<AlbumRow[]>([])
  const [likedAlbumsLoading, setLikedAlbumsLoading] = useState(true)
  const [savedAlbumsLoading, setSavedAlbumsLoading] = useState(true)
  const [likedAlbumSet, setLikedAlbumSet] = useState<Set<string>>(new Set())
  const [bookmarkedAlbumSet, setBookmarkedAlbumSet] = useState<Set<string>>(new Set())
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, OwnerProfile>>({})

  // Fetch liked albums
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLikedAlbums([])
          return
        }

        const { data, error } = await supabase
          .from("photo_album_likes")
          .select("created_at, photo_albums:photo_albums(id, owner_id, title, caption, cover_path, created_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!error && data) {
          const rows: AlbumRow[] = (data as any[]).map((d) => d.photo_albums)
          setLikedAlbums(rows)
          setLikedAlbumSet(new Set(rows.map((row) => row.id)))
        } else {
          setLikedAlbums([])
          setLikedAlbumSet(new Set())
        }
      } catch {
        setLikedAlbums([])
        setLikedAlbumSet(new Set())
      } finally {
        setLikedAlbumsLoading(false)
      }
    })()
  }, [])

  // Fetch saved albums
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setSavedAlbums([])
          return
        }

        const { data, error } = await supabase
          .from("photo_album_bookmarks")
          .select("created_at, photo_albums:photo_albums(id, owner_id, title, caption, cover_path, created_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!error && data) {
          const rows: AlbumRow[] = (data as any[]).map((d) => d.photo_albums)
          setSavedAlbums(rows)
          setBookmarkedAlbumSet(new Set(rows.map((row) => row.id)))
        } else {
          setSavedAlbums([])
          setBookmarkedAlbumSet(new Set())
        }
      } catch {
        setSavedAlbums([])
        setBookmarkedAlbumSet(new Set())
      } finally {
        setSavedAlbumsLoading(false)
      }
    })()
  }, [])

  // Fetch owner profiles for albums combined
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set([...(likedAlbums ?? []).map((a) => a.owner_id), ...savedAlbums.map((a) => a.owner_id)]))
        const missing = ids.filter((id) => !ownerProfiles[id])
        if (missing.length === 0) return

        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", missing)

        if (!error && data) {
          setOwnerProfiles((prev) => {
            const next = { ...prev }
            ;(data as any[]).forEach((profile) => {
              next[profile.id] = {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
              }
            })
            return next
          })
        }
      } catch {}
    })()
  }, [likedAlbums, savedAlbums, ownerProfiles])

  const toggleAlbumLike = async (albumId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        router.push("/auth/login")
        return
      }

      const wasLiked = likedAlbumSet.has(albumId)
      setLikedAlbumSet((prev) => {
        const next = new Set(prev)
        wasLiked ? next.delete(albumId) : next.add(albumId)
        return next
      })

      if (wasLiked) {
        setLikedAlbums((prev) => (prev ? prev.filter((album) => album.id !== albumId) : prev))
      } else {
        const source = savedAlbums.find((album) => album.id === albumId) || (likedAlbums ?? []).find((album) => album.id === albumId)
        if (source) {
          setLikedAlbums((prev) => [source, ...(prev ?? [])])
        }
      }

      await fetch(`/api/guidebook/albums/${albumId}/likes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (error) {
      console.error("Failed to toggle album like", error)
      setLikedAlbumSet((prev) => {
        const next = new Set(prev)
        if (next.has(albumId)) next.delete(albumId)
        else next.add(albumId)
        return next
      })
    }
  }

  const toggleAlbumBookmark = async (albumId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        router.push("/auth/login")
        return
      }

      const wasSaved = bookmarkedAlbumSet.has(albumId)
      setBookmarkedAlbumSet((prev) => {
        const next = new Set(prev)
        wasSaved ? next.delete(albumId) : next.add(albumId)
        return next
      })

      if (wasSaved) {
        setSavedAlbums((prev) => prev.filter((album) => album.id !== albumId))
      } else {
        const source = (likedAlbums ?? []).find((album) => album.id === albumId) || savedAlbums.find((album) => album.id === albumId)
        if (source) {
          setSavedAlbums((prev) => [source, ...prev])
        }
      }

      await fetch(`/api/guidebook/albums/${albumId}/bookmarks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (error) {
      console.error("Failed to toggle album bookmark", error)
      setBookmarkedAlbumSet((prev) => {
        const next = new Set(prev)
        if (next.has(albumId)) next.delete(albumId)
        else next.add(albumId)
        return next
      })
    }
  }

  return {
    likedAlbums,
    savedAlbums,
    likedAlbumsLoading,
    savedAlbumsLoading,
    likedAlbumSet,
    bookmarkedAlbumSet,
    ownerProfiles,
    toggleAlbumLike,
    toggleAlbumBookmark,
  }
}
