"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { useBookmark } from "@/hooks/useBookmark"
import type { BookmarkedVideo, FavoriteVideo, OwnerProfile } from "@/lib/types"

export function useFavoriteVideos() {
  const router = useRouter()
  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()

  const [likedVideos, setLikedVideos] = useState<FavoriteVideo[] | null>(null)
  const [likesLoading, setLikesLoading] = useState(true)

  const [bookmarkedVideos, setBookmarkedVideos] = useState<BookmarkedVideo[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [bookmarksError, setBookmarksError] = useState<string | null>(null)

  const [needLogin, setNeedLogin] = useState(false)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [optimisticDelta, setOptimisticDelta] = useState<Record<string, number>>({})
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, OwnerProfile>>({})

  // Fetch liked videos once
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setNeedLogin(true)
          setLikedVideos([])
          return
        }

        const { data, error } = await supabase
          .from("video_likes")
          .select("created_at, videos(id, owner_id, playback_url, title, caption, created_at)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!error && data) {
          const rows = (data as any[]).map((d) => d.videos as FavoriteVideo)
          setLikedVideos(rows)
        } else {
          setLikedVideos([])
        }
      } catch {
        setLikedVideos([])
      } finally {
        setLikesLoading(false)
      }
    })()
  }, [])

  // Fetch bookmarked videos via API route
  useEffect(() => {
    const fetchBookmarked = async () => {
      try {
        setBookmarksLoading(true)
        setBookmarksError(null)

        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        if (!accessToken) {
          setNeedLogin(true)
          setBookmarkedVideos([])
          return
        }

        const res = await fetch("/api/bookmarks", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "ブックマークの取得に失敗しました")
        }

        const data = await res.json()
        setBookmarkedVideos(data.bookmarks || [])
      } catch (err) {
        console.error("Failed to fetch bookmarked videos:", err)
        setBookmarksError(err instanceof Error ? err.message : "エラーが発生しました")
        setBookmarkedVideos([])
      } finally {
        setBookmarksLoading(false)
      }
    }

    fetchBookmarked()
  }, [])

  // Initialize liked set, counts, owner profiles once likes load
  useEffect(() => {
    if (!likedVideos || likedVideos.length === 0) {
      setLikedSet(new Set())
      setLikeCounts({})
      setOptimisticDelta({})
      return
    }

    setLikedSet(new Set(likedVideos.map((v) => v.id)))

    ;(async () => {
      try {
        const ids = likedVideos.map((v) => v.id)
        const { data, error } = await supabase
          .from("videos")
          .select("id, video_likes(count)")
          .in("id", ids)

        if (!error && data) {
          const map: Record<string, number> = {}
          ;(data as any[]).forEach((row) => {
            const count = row?.video_likes?.[0]?.count ?? 0
            map[row.id] = count
          })
          setLikeCounts(map)
        }
      } catch {}
    })()

    ;(async () => {
      try {
        const ownerIds = Array.from(new Set(likedVideos.map((v) => v.owner_id)))
        if (ownerIds.length === 0) return

        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ownerIds)

        if (!error && data) {
          const map: Record<string, OwnerProfile> = {}
          ;(data as any[]).forEach((profile) => {
            map[profile.id] = {
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            }
          })
          setOwnerProfiles((prev) => ({ ...prev, ...map }))
        }
      } catch {}
    })()
  }, [likedVideos])

  // Initialize bookmarked set once data arrives
  useEffect(() => {
    if (bookmarkedVideos.length > 0) {
      setBookmarkedSet(new Set(bookmarkedVideos.map((bookmark) => bookmark.videos.id)))
    } else {
      setBookmarkedSet(new Set())
    }
  }, [bookmarkedVideos])

  // Sync with bookmark hook state
  useEffect(() => {
    if (bookmarkedVideoIds) {
      setBookmarkedSet(new Set(Array.from(bookmarkedVideoIds)))
    }
  }, [bookmarkedVideoIds])

  // Fetch owner profiles for bookmarked videos
  useEffect(() => {
    (async () => {
      try {
        const ids = Array.from(new Set(bookmarkedVideos.map((b) => b.videos.owner_id).filter(Boolean))) as string[]
        if (ids.length === 0) return
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids)
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
  }, [bookmarkedVideos])

  const getLikeCount = (id: string) => (likeCounts[id] ?? 0) + (optimisticDelta[id] ?? 0)

  const removeBookmark = async (videoId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) return

      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      })

      if (response.ok) {
        setBookmarkedVideos((prev) => prev.filter((bookmark) => bookmark.videos.id !== videoId))
        setBookmarkedSet((prev) => {
          const next = new Set(prev)
          next.delete(videoId)
          return next
        })
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error)
    }
  }

  const toggleBookmarkForVideo = async (video: FavoriteVideo) => {
    try {
      await toggleBookmark(video.id)
      const willBeBookmarked = !bookmarkedSet.has(video.id)

      if (willBeBookmarked) {
        setBookmarkedSet((prev) => new Set(prev).add(video.id))
        setBookmarkedVideos((prev) => {
          const exists = prev.some((bookmark) => bookmark.videos.id === video.id)
          if (exists) return prev
          const next: BookmarkedVideo = {
            id: `local-${video.id}`,
            created_at: new Date().toISOString(),
            videos: {
              id: video.id,
              title: (video.title ?? "").toString(),
              categories: Array.isArray((video as any).categories)
                ? (video as any).categories
                : ((video as any).category ? [(video as any).category] : []),
              playback_url: video.playback_url ?? FALLBACK_VIDEO_URL,
              caption: (video.caption ?? "").toString(),
              created_at: video.created_at ?? new Date().toISOString(),
              owner_id: video.owner_id ?? "",
            },
          }
          return [next, ...prev]
        })
      } else {
        setBookmarkedSet((prev) => {
          const next = new Set(prev)
          next.delete(video.id)
          return next
        })
        setBookmarkedVideos((prev) => prev.filter((b) => b.videos.id !== video.id))
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
    }
  }

  const handleToggleLikeInFeed = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const wasLiked = likedSet.has(id)
    setLikedSet((prev) => {
      const next = new Set(prev)
      wasLiked ? next.delete(id) : next.add(id)
      return next
    })
    setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? -1 : +1) }))

    try {
      await toggleLike(id, wasLiked)
      setLikedVideos((prev) => {
        if (!prev) return prev
        if (wasLiked) {
          return prev.filter((video) => video.id !== id)
        }
        return prev
      })
    } catch {
      setLikedSet((prev) => {
        const next = new Set(prev)
        wasLiked ? next.add(id) : next.delete(id)
        return next
      })
      setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? +1 : -1) }))
    }
  }

  const handleToggleLikeFromBookmarked = async (video: FavoriteVideo) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const id = video.id
    const wasLiked = likedSet.has(id)
    setLikedSet((prev) => {
      const next = new Set(prev)
      wasLiked ? next.delete(id) : next.add(id)
      return next
    })
    setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? -1 : +1) }))

    try {
      await toggleLike(id, wasLiked)
      setLikedVideos((prev) => {
        const list = prev ?? []
        if (wasLiked) {
          return list.filter((v) => v.id !== id)
        }
        const exists = list.some((v) => v.id === id)
        if (exists) return list
        const next = {
          id,
          owner_id: (video as any).owner_id ?? "",
          playback_url: video.playback_url ?? FALLBACK_VIDEO_URL,
          title: video.title ?? null,
          caption: video.caption ?? null,
          created_at: video.created_at ?? new Date().toISOString(),
        }
        return [next, ...list]
      })
    } catch (error) {
      console.error("toggle like failed", error)
      setLikedSet((prev) => {
        const next = new Set(prev)
        wasLiked ? next.add(id) : next.delete(id)
        return next
      })
      setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? +1 : -1) }))
    }
  }

  return {
    likedVideos,
    likesLoading,
    bookmarkedVideos,
    bookmarksLoading,
    bookmarksError,
    needLogin,
    likedSet,
    bookmarkedSet,
    ownerProfiles,
    getLikeCount,
    toggleBookmarkForVideo,
    removeBookmark,
    handleToggleLikeInFeed,
    handleToggleLikeFromBookmarked,
  }
}
