"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, Bookmark, User, Heart, Send, Star, RefreshCw } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRandomVideos, type VideoData } from "@/hooks/useRandomVideos"
import { mockRestaurants } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"
import { openReservationForVideo as openReserveShared, openStoreDetailForVideo as openStoreShared } from "@/lib/video-actions"
import { useBookmark } from "@/hooks/useBookmark"
import VideoCard from "@/components/VideoCard"
import AlbumCard from "@/components/AlbumCard"
import AlbumViewerOverlay from "../../components/AlbumViewerOverlay"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"

type SupabaseVideoRow = {
  id: string
  owner_id: string | null
  playback_url: string
  storage_path: string | null
  title: string | null
  caption: string | null
  created_at: string
  video_likes?: { count?: number }[]
}

export default function SearchPage() {
  const router = useRouter()
  const { videos, loading, error, fetchVideos, refreshVideos } = useRandomVideos()
  const _filters = ["ジャンル", "距離", "空席あり", "予算", "サブスク対応"] // TODO: 未使用
  const [showFilters, setShowFilters] = useState(false)
  const [_selectedDate, _setSelectedDate] = useState(0) // TODO: 未使用
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    形態: [],
    価格帯: [],
    時間帯: [],
    距離: [],
    趣味・嗜好: [],
  })
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SupabaseVideoRow[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [didSearch, setDidSearch] = useState(false)
  const [_expandedCategory, _setExpandedCategory] = useState<string | null>(null) // TODO: 未使用
  const categoryTabs = [
    "今日のおすすめ",
    "今人気のお店",
    "SNSで人気のお店",
    "Z世代に人気のお店",
    "デートにおすすめのお店",
    "最新動画",
    "ガイドブック",
  ]
  const [selectedCategory, setSelectedCategory] = useState("今日のおすすめ")
  const isLatestCategory = selectedCategory === "最新動画"
  const isGuidebookCategory = selectedCategory === "ガイドブック"
  type AlbumItem = {
    id: string
    title?: string | null
    description?: string | null
    coverUrl?: string | null
    createdAt?: string | null
    owner?: { username?: string | null; displayName?: string | null; avatarUrl?: string | null } | null
  }
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsError, setAlbumsError] = useState<string | null>(null)
  // Album like/bookmark state
  const [albumLikedSet, setAlbumLikedSet] = useState<Set<string>>(new Set())
  const [albumBookmarkedSet, setAlbumBookmarkedSet] = useState<Set<string>>(new Set())
  // Album viewer state
  type AssetItem = { id: string; url: string; order: number; width?: number | null; height?: number | null }
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const [albumAssets, setAlbumAssets] = useState<AssetItem[]>([])
  const [albumIndex, setAlbumIndex] = useState(0)
  const [albumLoading, setAlbumLoading] = useState(false)
  // const [showVideoFeed, setShowVideoFeed] = useState(false)
  // const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<
    | {
        id: string
        name: string
        avatar?: string | null
        isFollowing?: boolean
      }
    | null
  >(null)
  const [popularKeywordsSet, setPopularKeywordsSet] = useState(0)

  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<
    | {
        id: string
        restaurantName: string
        restaurantEmail: string
        genre: string
        distance: string
        rating: number
        caption?: string
      }
    | null
  >(null)
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  const [_randomRestaurants, setRandomRestaurants] = useState<any[]>([]) // TODO: 未使用
  const [supabaseVideos, setSupabaseVideos] = useState<SupabaseVideoRow[]>([])
  const playersRef = useRef<Record<string, HTMLVideoElement | null>>({})
  const [videoLimit, setVideoLimit] = useState(6)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const latestSentinelRef = useRef<HTMLDivElement | null>(null)
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<SupabaseVideoRow | null>(null)
  const [videoLikeCounts, setVideoLikeCounts] = useState<Record<string, number>>({})
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})
  const [fullscreenMuted, setFullscreenMuted] = useState(false)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fullscreenScrollLockRef = useRef<{
    scrollY: number
    body: { top: string; position: string; overflow: string; width: string }
  } | null>(null)

  const normalizeOptionalText = (input?: string | null) => {
    if (typeof input !== "string") return undefined
    const trimmed = input.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }



  const selectSupabaseVideo = (video: SupabaseVideoRow) => {
    setSelectedVideo({
      ...video,
      caption: normalizeOptionalText(video.caption) ?? null,
    })
    setShowFullscreenVideo(true)
  }

  // Fullscreen overlay interactions (like/favorite)
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set())
  const likeMutationRef = useRef<Set<string>>(new Set())
  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()

  useEffect(() => {
    document.body.classList.add("scrollbar-hide")
    return () => {
      document.body.classList.remove("scrollbar-hide")
    }
  }, [])

  // Fetch guidebook albums when tab is active
  useEffect(() => {
    if (!isGuidebookCategory) return
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
  }, [isGuidebookCategory])

  // Fetch album like/bookmark states for current user
  useEffect(() => {
    ;(async () => {
      try {
        if (!isGuidebookCategory) return
        if (!albums || albums.length === 0) { setAlbumLikedSet(new Set()); setAlbumBookmarkedSet(new Set()); return }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setAlbumLikedSet(new Set()); setAlbumBookmarkedSet(new Set()); return }
        const albumIds = albums.map((a) => a.id)
        const [likedRes, savedRes] = await Promise.all([
          supabase.from("photo_album_likes").select("album_id").eq("user_id", user.id).in("album_id", albumIds),
          supabase.from("photo_album_bookmarks").select("album_id").eq("user_id", user.id).in("album_id", albumIds),
        ])
        if (!likedRes.error && likedRes.data) setAlbumLikedSet(new Set((likedRes.data as any[]).map((r) => r.album_id)))
        else setAlbumLikedSet(new Set())
        if (!savedRes.error && savedRes.data) setAlbumBookmarkedSet(new Set((savedRes.data as any[]).map((r) => r.album_id)))
        else setAlbumBookmarkedSet(new Set())
      } catch {
        setAlbumLikedSet(new Set()); setAlbumBookmarkedSet(new Set())
      }
    })()
  }, [isGuidebookCategory, albums])

  async function toggleAlbumLike(albumId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) { router.push("/auth/login"); return }
      const wasLiked = albumLikedSet.has(albumId)
      setAlbumLikedSet((prev) => { const s = new Set(prev); wasLiked ? s.delete(albumId) : s.add(albumId); return s })
      await fetch(`/api/guidebook/albums/${albumId}/likes`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    } catch {
      setAlbumLikedSet((prev) => { const s = new Set(prev); if (s.has(albumId)) s.delete(albumId); else s.add(albumId); return s })
    }
  }

  async function toggleAlbumBookmark(albumId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) { router.push("/auth/login"); return }
      const wasSaved = albumBookmarkedSet.has(albumId)
      setAlbumBookmarkedSet((prev) => { const s = new Set(prev); wasSaved ? s.delete(albumId) : s.add(albumId); return s })
      await fetch(`/api/guidebook/albums/${albumId}/bookmarks`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    } catch {
      setAlbumBookmarkedSet((prev) => { const s = new Set(prev); if (s.has(albumId)) s.delete(albumId); else s.add(albumId); return s })
    }
  }

  // Open album viewer
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
      // eslint-disable-next-line no-console
      console.error("open album error", e)
      setAlbumAssets([])
      setOpenAlbumId(albumId)
    } finally {
      setAlbumLoading(false)
    }
  }

  async function toggleVideoLike(videoId: string) {
    if (likeMutationRef.current.has(videoId)) return
    const wasLiked = likedVideoIds.has(videoId)
    likeMutationRef.current.add(videoId)
    try {
      const result = await toggleLike(videoId, wasLiked)
      if ((result as any)?.needLogin) { // TODO: 型を詰める
        router.push("/auth/login")
        return
      }
      const nowLiked = (result as any)?.liked ?? !wasLiked // TODO: 型を詰める
      setLikedVideoIds((prev) => {
        const next = new Set(prev)
        if (nowLiked) next.add(videoId)
        else next.delete(videoId)
        return next
      })
      setVideoLikeCounts((prev) => {
        const current = prev[videoId] ?? 0
        const delta = nowLiked ? 1 : -1
        const nextCount = Math.max(0, current + delta)
        return { ...prev, [videoId]: nextCount }
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("like toggle error", e)
    } finally {
      likeMutationRef.current.delete(videoId)
    }
  }
  function mapVideoToRestaurant(video: SupabaseVideoRow | null) {
    if (!video) return null
    const title = (video.title || "おすすめ動画").trim() || "おすすめ動画"
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"
    return {
      id: video.id,
      restaurantName: title,
      restaurantEmail: `info@${slug}.example.com`,
      genre: "おすすめ",
      distance: "—",
      rating: 0,
    }
  }

  function openReservationForVideo(video: SupabaseVideoRow | null, options?: { keepFullscreen?: boolean }) {
    openReserveShared({ setSelectedRestaurant, setShowReservationModal, setShowFullscreenVideo }, video as any, options)
  }

  function openStoreDetailForVideo(video: SupabaseVideoRow | null, options?: { keepFullscreen?: boolean }) {
    openStoreShared({ setSelectedRestaurant, setShowStoreDetailModal, setShowFullscreenVideo }, video as any, options)
  }

  function openRandomVideoFullscreen(video: VideoData) {
    const playbackUrl = video.public_url
    if (!playbackUrl) return

    if (video.user?.id) {
      setOwnerProfiles((prev) => {
        const existing = prev[video.user!.id]
        const nextProfile = {
          username: video.user?.username,
          display_name: video.user?.name,
          avatar_url: video.user?.avatar_url ?? null,
        }
        if (
          existing &&
          existing.username === nextProfile.username &&
          existing.display_name === nextProfile.display_name &&
          existing.avatar_url === nextProfile.avatar_url
        ) {
          return prev
        }
        return { ...prev, [video.user!.id]: nextProfile }
      })
    }

    setVideoLikeCounts((prev) => {
      if (prev[video.id] !== undefined) return prev
      return { ...prev, [video.id]: 0 }
    })

    setSelectedVideo({
      id: video.id,
      owner_id: video.user?.id ?? null,
      playback_url: playbackUrl,
      storage_path: null,
      title: video.title ?? null,
      caption:
        normalizeOptionalText(video.caption) ?? null,
      created_at: video.created_at,
      video_likes: [],
    })
    setShowFullscreenVideo(true)
  }

  function escapeIlike(input: string) {
    return input.replace(/[%_]/g, "\\$&")
  }

  async function performSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setSearchLoading(true)
    setSearchError(null)
    try {
      const pattern = `%${escapeIlike(trimmed)}%`
      const { data, error } = await supabase
        .from("videos")
        .select("id, owner_id, playback_url, storage_path, title, caption, created_at, video_likes(count)")
        .or(`title.ilike.${pattern},caption.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(40)

      if (error) throw error
      const arr = (data as SupabaseVideoRow[]) || []
      setSearchResults(arr)
      setDidSearch(true)

      // いいね数を反映
      setVideoLikeCounts((prev) => {
        const next = { ...prev }
        arr.forEach((row) => {
          next[row.id] = row.video_likes?.[0]?.count ?? next[row.id] ?? 0
        })
        return next
      })

      // オーナープロフィールを取得
      const ownerIds = Array.from(new Set(arr.map((row) => row.owner_id).filter((id): id is string => Boolean(id))))
      if (ownerIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ownerIds)
        if (!profileErr && profileRows) {
          setOwnerProfiles((prev) => {
            const next = { ...prev }
            ;(profileRows as any[]).forEach((p) => {
              next[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
            })
            return next
          })
        }
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn("search error", e)
      setSearchError(e?.message ?? "検索に失敗しました")
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchSubmit() {
    if (!searchTerm.trim()) return
    setDidSearch(true)
    performSearch(searchTerm)
    setIsSearchMode(false)
  }

  function clearSearch() {
    setSearchTerm("")
    setSearchResults([])
    setSearchError(null)
    setDidSearch(false)
  }

  // When opening fullscreen, try to play proactively and pause other inline players
  useEffect(() => {
    if (showFullscreenVideo && selectedVideo) {
      try {
        Object.values(playersRef.current).forEach((el) => {
          if (el) try { el.pause() } catch {}
        })
      } catch {}

      const id = requestAnimationFrame(() => {
        const el = fullscreenVideoRef.current
        if (el) {
          try {
            el.muted = fullscreenMuted
            if (!fullscreenMuted) {
              el.volume = 1
            }
            el.play().catch(() => {})
          } catch {}
        }
      })
      return () => cancelAnimationFrame(id)
    }
  }, [showFullscreenVideo, selectedVideo, fullscreenMuted])

  // Video URLs array

  const filterOptions = {
    形態: [
      "居酒屋",
      "チェーン店",
      "個人店",
      "カフェ",
      "ファミレス",
      "高級店",
      "バー",
      "ラーメン店",
      "焼肉店",
      "寿司店",
    ],
    価格帯: ["〜1,000円", "1,000〜2,000円", "2,000〜3,000円", "3,000〜5,000円", "5,000〜8,000円", "8,000円〜"],
    時間帯: ["11:00〜13:00", "13:00〜15:00", "15:00〜17:00", "17:00〜19:00", "19:00〜21:00", "21:00〜23:00", "23:00〜"],
    距離: ["徒歩5分(0.4km)", "徒歩10分(0.8km)", "徒歩15分(1.2km)", "徒歩20分(1.6km)", "徒歩25分(2.0km)", "2km以上"],
    趣味・嗜好: [
      "甘いもの",
      "魚系",
      "肉系",
      "辛いもの",
      "あっさり",
      "こってり",
      "ヘルシー",
      "ボリューム",
      "和食",
      "洋食",
      "中華",
      "エスニック",
    ],
  }

  const popularKeywordsSets = [
    ["和食", "イタリアン", "焼肉", "寿司", "ラーメン"],
    ["カフェ", "居酒屋", "フレンチ", "中華", "韓国料理"],
    ["パスタ", "ピザ", "うどん", "そば", "天ぷら"],
    ["ハンバーガー", "タイ料理", "インド料理", "スペイン料理", "メキシコ料理"],
    ["ステーキ", "しゃぶしゃぶ", "お好み焼き", "たこ焼き", "串カツ"],
  ]
  const EMPTY_INFLUENCER_COMMENT_MESSAGE = "感想は追加されていません"

  const handleFilterToggle = (category: string, option: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option],
    }))
  }

  const getSelectedCount = (category: string | null) => {
    if (!category) return 0
    return selectedFilters[category]?.length ?? 0
  }

  const getTotalSelectedCount = () => {
    return Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0)
  }

  const clearAllFilters = () => {
    setSelectedFilters({
      形態: [],
      価格帯: [],
      時間帯: [],
      距離: [],
      趣味・嗜好: [],
    })
  }

  const toggleFavorite = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const videoId = String(id)
    try {
      await toggleBookmark(videoId)
      setSelectedUser((prev) => {
        if (!prev || String(prev.id) !== videoId) return prev
        return { ...prev, isFollowing: !prev.isFollowing }
      })
    } catch (error: any) { // TODO: 型を詰める
      if (error?.message === "ログインが必要です") {
        router.push("/auth/login")
      }
    }
  }

  useEffect(() => {
    setSelectedUser((prev) => {
      if (!prev) return prev
      const videoId = String(prev.id)
      const isFollowing = bookmarkedVideoIds.has(videoId)
      if (prev.isFollowing === isFollowing) return prev
      return { ...prev, isFollowing }
    })
  }, [bookmarkedVideoIds])

  const handleRefreshVideos = () => {
    if (isLatestCategory || isGuidebookCategory) return
    const categoryForFetch = selectedCategory === "今日のおすすめ" ? undefined : selectedCategory
    refreshVideos(categoryForFetch, 10)
  }

  const handleRefreshAlbums = async () => {
    if (!isGuidebookCategory) return
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

  function FilterButton({ label }: { label: string }) {
    return (
      <button className="w-full border border-gray-300 rounded-full py-3 px-4 text-gray-700 hover:bg-gray-100 transition text-left">
        {label}
      </button>
    )
  }

  useEffect(() => {
    const shuffled = [...mockRestaurants].sort(() => 0.5 - Math.random())
    setRandomRestaurants(shuffled.slice(0, 6))
  }, [selectedCategory])
  useEffect(() => {
    if (selectedCategory === "最新動画" || selectedCategory === "ガイドブック") return
    const categoryForFetch = selectedCategory === "今日のおすすめ" ? undefined : selectedCategory
    fetchVideos(categoryForFetch, 10)
  }, [selectedCategory, fetchVideos])

  // Load videos from Supabase (initial 6, then +2)
  useEffect(() => {
    ;(async () => {
      try {
        const { data, count, error } = await supabase
          .from("videos")
          .select("id, owner_id, playback_url, storage_path, title, caption, created_at, video_likes(count)", {
            count: "exact",
          })
          .order("created_at", { ascending: false })
          .range(0, Math.max(0, videoLimit - 1))
        if (error) throw error
        const arr = (data as SupabaseVideoRow[]) || []
        setSupabaseVideos(arr)
        const likeMap: Record<string, number> = {}
        arr.forEach((row) => {
          likeMap[row.id] = row.video_likes?.[0]?.count ?? 0
        })
        setVideoLikeCounts(likeMap)

        const ownerIds = Array.from(new Set(arr.map((row) => row.owner_id).filter((id): id is string => Boolean(id))))
        if (ownerIds.length > 0) {
          const { data: profileRows, error: profileErr } = await supabase
            .from("user_profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", ownerIds)
          if (!profileErr && profileRows) {
            setOwnerProfiles((prev) => {
              const next = { ...prev }
              ;(profileRows as any[]).forEach((p) => { // TODO: 型を詰める
                next[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
              })
              return next
            })
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          if (arr.length > 0) {
            const videoIds = arr.map((row) => row.id)
            const { data: likedRows, error: likedErr } = await supabase
              .from("video_likes")
              .select("video_id")
              .eq("user_id", user.id)
              .in("video_id", videoIds)
            if (!likedErr && likedRows) {
              setLikedVideoIds(new Set((likedRows as any[]).map((r) => r.video_id))) // TODO: 型を詰める
            } else {
              setLikedVideoIds(new Set())
            }
          } else {
            setLikedVideoIds(new Set())
          }
        } else {
          setLikedVideoIds(new Set())
        }
        if (typeof count === "number") {
          setHasMoreVideos(arr.length < count)
        } else {
          // fallback: if returned満杯ならまだあるとみなす
          setHasMoreVideos(arr.length >= videoLimit)
        }
      } catch (e) {
        console.warn("search videos load error", e)
      }
    })()
  }, [videoLimit])

  useEffect(() => {
    if (!isLatestCategory) return
    const sentinel = latestSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreVideos) {
            setVideoLimit((prev) => prev + 6)
          }
        })
      },
      { root: null, rootMargin: "0px", threshold: 1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLatestCategory, hasMoreVideos])

  useEffect(() => {
    if (showFullscreenVideo) {
      setFullscreenMuted(false)
    }
  }, [showFullscreenVideo])

  useEffect(() => {
    const el = fullscreenVideoRef.current
    if (!el) return
    el.muted = fullscreenMuted
    if (!fullscreenMuted) {
      try {
        el.volume = 1
        const playPromise = el.play()
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {})
        }
      } catch {}
    }
  }, [fullscreenMuted])

  useEffect(() => {
    if (videos.length === 0) return
    setOwnerProfiles((prev) => {
      let changed = false
      const next = { ...prev }
      videos.forEach((video) => {
        const user = video.user
        if (user?.id) {
          const nextProfile = {
            username: user.username,
            display_name: user.name,
            avatar_url: user.avatar_url ?? null,
          }
          const existing = next[user.id]
          if (
            !existing ||
            existing.username !== nextProfile.username ||
            existing.display_name !== nextProfile.display_name ||
            existing.avatar_url !== nextProfile.avatar_url
          ) {
            next[user.id] = nextProfile
            changed = true
          }
        }
      })
      return changed ? next : prev
    })
  }, [videos])

  useEffect(() => {
    if (typeof document === "undefined") return
    const bodyStyle = document.body.style

    if (showFullscreenVideo) {
      fullscreenScrollLockRef.current = {
        scrollY: window.scrollY,
        body: {
          top: bodyStyle.top,
          position: bodyStyle.position,
          overflow: bodyStyle.overflow,
          width: bodyStyle.width,
        },
      }
      bodyStyle.top = `-${window.scrollY}px`
      bodyStyle.position = "fixed"
      bodyStyle.overflow = "hidden"
      bodyStyle.width = "100%"
    } else if (fullscreenScrollLockRef.current) {
      const previous = fullscreenScrollLockRef.current
      bodyStyle.top = previous.body.top
      bodyStyle.position = previous.body.position
      bodyStyle.overflow = previous.body.overflow
      bodyStyle.width = previous.body.width
      window.scrollTo({ top: previous.scrollY })
      fullscreenScrollLockRef.current = null
    }

    return () => {
      if (fullscreenScrollLockRef.current) {
        const previous = fullscreenScrollLockRef.current
        bodyStyle.top = previous.body.top
        bodyStyle.position = previous.body.position
        bodyStyle.overflow = previous.body.overflow
        bodyStyle.width = previous.body.width
        window.scrollTo({ top: previous.scrollY })
        fullscreenScrollLockRef.current = null
      }
    }
  }, [showFullscreenVideo])

  const selectedOwnerProfile = selectedVideo?.owner_id ? ownerProfiles[selectedVideo.owner_id] : undefined
  const selectedOwnerHandle = selectedOwnerProfile?.username
    ? `@${selectedOwnerProfile.username}`
    : selectedOwnerProfile?.display_name || "ユーザー"

  return (
    <div className="min-h-screen bg-white pb-20 overflow-y-auto scrollbar-hide">
      {/* Search Header */}
      <div className="bg-white px-6 py-4">
        {(isSearchMode || didSearch) ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
              <Input
                placeholder="店舗名・ジャンル・キーワードで検索"
                className="pl-10 rounded-full border-black text-black placeholder:text-gray-400"
                autoFocus={isSearchMode}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit() }}
              />
            </div>
              <Button onClick={handleSearchSubmit} className="bg-orange-600 hover:bg-orange-700 text-white" disabled={!searchTerm.trim() || searchLoading}>                                                       
                検索
              </Button>
            {isSearchMode && (
              <Button variant="ghost" onClick={() => setIsSearchMode(false)} className="text-black hover:text-gray-800">
                キャンセル
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <div onClick={() => setIsSearchMode(true)} className="flex-1 relative cursor-pointer">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
              <div className="pl-10 pr-4 py-2 border border-black rounded-full bg-white text-gray-400">
                店舗名・ジャンル・キーワードで検索
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs - only show when not in search mode */}
        {!isSearchMode && (
          <div className="mb-4">
            <div className="flex overflow-x-auto scrollbar-hide pb-2 gap-1">
              {categoryTabs.map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                      selectedCategory === category ? "text-black" : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {category}
                    {selectedCategory === category && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Search Categories - show when in search mode */}
        {isSearchMode && (
          <div className="bg-white relative z-10">
            <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide bg-white px-6 py-4">
              {/* Search History */}
              <div className="bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-black">検索履歴</h3>
                  <button
                    onClick={() => {
                      if (confirm("検索履歴を削除しますか？")) {
                        // Clear search history logic here
                        alert("検索履歴を削除しました")
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 transition"
                  >
                    削除する
                  </button>
                </div>
                <div className="space-y-1 bg-white">
                  {["焼肉", "イタリアン 渋谷", "カフェ 新宿", "ラーメン", "寿司 銀座"].map((history, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1 hover:bg-gray-50 transition bg-white"
                    >
                      <span className="text-black text-sm">{history}</span>
                      <button className="text-black hover:text-gray-600 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Genres/Keywords */}
              <div className="bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-black">人気のジャンル・キーワード</h3>
                  <button
                    onClick={() => {
                      setPopularKeywordsSet((prev) => (prev + 1) % popularKeywordsSets.length)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 transition"
                  >
                    更新する
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 bg-white">
                  {popularKeywordsSets[popularKeywordsSet].map((genre, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(genre)
                        setIsSearchMode(false)
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 h-[90vh] flex flex-col">
            <div className="flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b relative">
                <Button variant="ghost" size="sm" onClick={() => setShowUserProfile(false)}>
                  ＜
                </Button>
                <h2 className="text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">プロフィール</h2>
                <div className="w-8"></div>
              </div>

              {/* Profile Info */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-2xl shadow-lg">
                    {selectedUser.name.charAt(1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1">{selectedUser.name}</h3>
                    <p className="text-gray-600 text-sm mb-1">グルメインフルエンサー</p>
                    <p className="text-gray-500 text-xs">📍 東京 • 🍽️ 美味しいお店を紹介中</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    🍜 東京のグルメスポットを毎日投稿
                    <br />📸 美味しい瞬間をお届け
                    <br />💌 コラボのご相談はDMまで
                    <br />
                    ⬇️ 最新のおすすめ店舗をチェック！
                  </p>
                </div>

                {/* Stats */}
                <div className="flex justify-around mb-6 py-4 border-y">
                  <div className="text-center">
                    <div className="font-bold text-lg">127</div>
                    <div className="text-gray-600 text-sm">投稿</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">12.4K</div>
                    <div className="text-gray-600 text-sm">フォロワー</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">892</div>
                    <div className="text-gray-600 text-sm">フォロー中</div>
                  </div>
                </div>

                {/* Follow Button */}
                <Button
                  className={`w-full py-3 font-semibold transition mb-4 ${
                    selectedUser.isFollowing
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  onClick={async () => {
                    if (selectedUser.isFollowing) {
                      await toggleFavorite(selectedUser.id)
                    } else {
                      window.open(`https://instagram.com/${selectedUser.name}`, "_blank")
                    }
                  }}
                >
                  {selectedUser.isFollowing ? "フォロー中" : "フォローする"}
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <Button
                    variant="outline"
                    className="w-full py-2 text-sm font-medium border-gray-300 hover:bg-gray-50 bg-transparent"
                    onClick={() =>
                      window.open(
                        `https://instagram.com/direct/new/?username=${selectedUser.name.replace("@", "")}`,
                        "_blank",
                      )
                    }
                  >
                    メッセージ
                  </Button>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pb-6">
                <h4 className="font-semibold mb-4">投稿</h4>
                <div className="grid grid-cols-3 gap-1">
                  {videos.slice(0, 9).map((post, index) => (
                    <div key={index} className="aspect-square relative">
                      <video
                        src={post.public_url}
                        className="w-full h-full object-cover rounded"
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal - Full Screen */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 animate-in fade-in duration-300">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
            {!selectedFilterCategory ? (
              // Main Filter Categories
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <div></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    すべて解除
                  </Button>
                </div>

                {/* Filter Categories */}
                <div className="flex-1 p-6">
                  <div className="space-y-4">
                    <FilterButton label="形態" />
                    <FilterButton label="価格帯" />
                    <FilterButton label="時間帯" />
                    <FilterButton label="距離" />
                    <FilterButton label="趣味・嗜好" />
                  </div>
                </div>

                {/* Bottom Button */}
                <div className="p-6 border-t bg-white pb-32">
                  <div className="flex justify-center pt-4">
                    <Button
                      className="bg-orange-500 text-white font-bold py-2 px-8 rounded-full shadow-md hover:bg-orange-600 transition"
                      onClick={() => setShowFilters(false)}
                    >
                      絞り込み
                      {getTotalSelectedCount() > 0 && (
                        <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                          {getTotalSelectedCount()}件選択中
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Specific Filter Options
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFilterCategory(null)}>
                    ←
                  </Button>
                  <h2 className="text-lg font-semibold">{selectedFilterCategory}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Filter Options */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-3">
                    {(filterOptions[selectedFilterCategory as keyof typeof filterOptions] ?? []).map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                        <Checkbox
                          id={option}
                          checked={
                            selectedFilterCategory ? selectedFilters[selectedFilterCategory].includes(option) : false
                          }
                          onCheckedChange={() => handleFilterToggle(selectedFilterCategory, option)}
                        />
                        <label htmlFor={option} className="flex-1 cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Button */}
                <div className="fixed bottom-0 left-0 right-0 p-6 border-t bg-white z-10">
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setSelectedFilterCategory(null)}
                  >
                    選択完了
                    {selectedFilterCategory && getSelectedCount(selectedFilterCategory) > 0 && (
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                        {getSelectedCount(selectedFilterCategory)}件選択中
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowReservationModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">お店を予約する</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 名前入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">お名前</label>
                <input
                  type="text"
                  value={reservationData.name || ""}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="お名前を入力してください"
                />
              </div>

              {/* 人数選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">人数</label>
                <div className="flex items-center justify-center">
                  <select
                    value={reservationData.people}
                    onChange={(e) =>
                      setReservationData((prev) => ({ ...prev, people: Number.parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}名
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 日付選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">日付</label>
                <input
                  type="date"
                  value={reservationData.date}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* 時間帯選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">時間帯</label>
                <select
                  value={reservationData.time}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 11
                    const minute = i % 2 === 0 ? "00" : "30"
                    if (hour > 23) return null
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minute}`
                    return (
                      <option key={timeStr} value={timeStr}>
                        {timeStr}
                      </option>
                    )
                  }).filter(Boolean)}
                </select>
              </div>

              {/* 席タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">席タイプ</label>
                <select
                  value={reservationData.seatType}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, seatType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="指定なし">指定なし</option>
                  <option value="テーブル">テーブル</option>
                  <option value="カウンター">カウンター</option>
                  <option value="個室">個室</option>
                </select>
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">メッセージ（任意）</label>
                <textarea
                  value={reservationData.message}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="アレルギーや特別なリクエストがあればお書きください"
                />
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  // 予約リクエスト送信処理（現在はUI表示のみ）
                  alert("予約リクエストを送信しました！")
                  setShowReservationModal(false)
                }}
              >
                予約リクエストを送信
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Store Detail Modal */}
      {showStoreDetailModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowStoreDetailModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">店舗詳細</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 店舗名 */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedRestaurant.restaurantName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRestaurant.rating}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.genre}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.distance}</span>
                </div>
              </div>

              {/* 店舗情報 */}
              {/* 店舗情報セクションは今後の拡張用に保持 */}
              {/*
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">店舗情報</h4>
                <div className="flex items-center justify-center rounded-lg bg-gray-50 py-6 text-sm text-gray-500">
                  {EMPTY_STORE_INFO_MESSAGE}
                </div>
              </div>
              */}

              {/* インフルエンサーの感想 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">詳細情報</h4>
                {selectedRestaurant?.caption ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedRestaurant.caption}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg bg-gray-50 py-6 text-sm text-gray-500">
                    {EMPTY_INFLUENCER_COMMENT_MESSAGE}
                  </div>
                )}
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  setShowStoreDetailModal(false)
                  setShowReservationModal(true)
                }}
              >
                この店舗を予約する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results - DBから取得した動画を表示 */}
      {!isSearchMode && (
        <div className="px-6 py-4 bg-white overflow-y-auto scrollbar-hide">
          <div className="space-y-6">
              {didSearch && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">検索結果</h2>
                  <div className="flex items-center gap-2">
                    {searchLoading && <span className="text-sm text-gray-600">検索中...</span>}
                    {!searchLoading && !searchError && (
                      <span className="text-sm text-gray-600">{searchResults.length}件</span>
                    )}
                    <button
                      onClick={clearSearch}
                      className="p-1 hover:bg-gray-100 rounded transition-colors text-sm text-gray-600"
                      disabled={searchLoading}
                    >
                      クリア
                    </button>
                  </div>
                </div>
                {searchError ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="text-red-500 mb-2">{searchError}</div>
                    <button onClick={() => performSearch(searchTerm)} className="text-blue-600 hover:text-blue-700 underline">再試行</button>
                  </div>
                ) : searchLoading ? (
                  <div className="flex justify-center py-8"><div className="text-gray-500">検索中...</div></div>
                ) : (
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.map((v) => {
                    const ownerProfile = v.owner_id ? ownerProfiles[v.owner_id] : undefined
                    const ownerHandle = ownerProfile?.username ? `@${ownerProfile.username}` : (ownerProfile?.display_name || "ユーザー")
                    const isBookmarked = bookmarkedVideoIds.has(v.id)
                    return (
                      <VideoCard
                        key={v.id}
                        posterUrl={derivePosterUrl(v.playback_url, v.storage_path) || "/placeholder.jpg"}
                        title={v.title || v.caption || '動画'}
                        onClickCard={() => selectSupabaseVideo(v)}
                        showTopBookmark
                        isBookmarked={isBookmarked}
                        onToggleBookmark={(e) => toggleFavorite(v.id, e as any)}
                        bottomMetaVariant="account"
                        accountAvatarUrl={ownerProfile?.avatar_url}
                        accountLabel={ownerHandle}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            )}
              {!didSearch && !isLatestCategory && !isGuidebookCategory && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedCategory}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{videos.length}件</span>
                  <button
                    onClick={handleRefreshVideos}
                    disabled={loading}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {searchError && (
                  <div className="flex flex-col items-center py-8">
                    <div className="text-red-500 mb-2">{searchError}</div>
                    <button onClick={() => performSearch(searchTerm)} className="text-blue-600 hover:text-blue-700 underline">
                      再試行
                    </button>
                  </div>
                )}

                {!searchError && !searchLoading && searchResults.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-gray-500">
                    検索結果が見つかりませんでした
                  </div>
                )}

              {/* 2x3 Grid Layout - DBから取得した動画 */}
              {!loading && !error && (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      posterUrl={derivePosterUrl(video.public_url) || "/placeholder.jpg"}
                      title={video.title}
                      onClickCard={() => openRandomVideoFullscreen(video)}
                      showTopBookmark
                      isBookmarked={bookmarkedVideoIds.has(video.id)}
                      onToggleBookmark={(e) => toggleFavorite(video.id, e as any)}
                      bottomMetaVariant="account"
                      accountAvatarUrl={video.user.avatar_url}
                      accountLabel={`@${video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}`}
                    />
                  ))}
                </div>
              )}

                  {/* Loading State */}
                  {loading && (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-500">動画を読み込み中...</div>
                    </div>
                  )}

            {/* Supabase videos list (play on demand) */}
              {!didSearch && isLatestCategory && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedCategory}</h2>
                <span className="text-sm text-gray-600">{supabaseVideos.length}件</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {supabaseVideos.map((v) => {
                  const ownerProfile = v.owner_id ? ownerProfiles[v.owner_id] : undefined
                  const ownerHandle = ownerProfile?.username
                    ? `@${ownerProfile.username}`
                    : ownerProfile?.display_name || "ユーザー"
                  const isBookmarked = bookmarkedVideoIds.has(v.id)

                  return (
                    <Card
                      key={v.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      aria-label={`動画を全画面で表示（${v.title || "動画"}）`}
                      title="動画を全画面で表示"
                      onClick={() => {
                        selectSupabaseVideo(v)
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[9/16] relative">
                          <video
                            ref={(el) => { playersRef.current[v.id] = el }}
                            src={v.playback_url}
                            className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                            poster={derivePosterUrl(v.playback_url, v.storage_path) || "/placeholder.jpg"}
                            playsInline
                            preload="metadata"
                            controls={false}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectSupabaseVideo(v)
                            }}
                          />
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(v.id, e)}
                              className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition"
                              aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isBookmarked ? "fill-orange-500 text-orange-500" : "text-white"}`}
                              />
                              <div className="absolute top-2 right-2 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavorite(video.id, e)}
                                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition"
                                  aria-label={bookmarkedVideoIds.has(video.id) ? "ブックマーク解除" : "ブックマーク"}
                                >
                                  <Bookmark
                                    className={`w-4 h-4 ${
                                      bookmarkedVideoIds.has(video.id) ? "fill-orange-500 text-orange-500" : "text-white"
                                    }`}
                                  />
                                </button>
                              </div>
                              {/* Play button overlay */}
                              <div
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openRandomVideoFullscreen(video)
                                }}
                              >
                                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all">
                                  <div className="w-0 h-0 border-l-[20px] border-l-gray-800 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                                </div>
                              </div>
                            </div>

                            <div
                              className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser({
                                  id: video.id,
                                  name: `@${video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}`,
                                  avatar: video.user.avatar_url,
                                  isFollowing: bookmarkedVideoIds.has(video.id),
                                })
                                setShowUserProfile(true)
                              }}
                            >
                              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                                {video.title}
                              </h3>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                    {video.user.avatar_url ? (
                                      <>
                                        {/* eslint-disable-next-line @next/next/no-img-element -- TODO: 画像最適化は後で対応 */}
                                        <img 
                                          src={video.user.avatar_url} 
                                          alt={video.user.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </>
                                    ) : (
                                      <User className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    @{video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

              {!didSearch && isGuidebookCategory && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedCategory}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{albums.length}件</span>
                  <button
                    onClick={handleRefreshAlbums}
                    disabled={albumsLoading}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label="アルバムを更新"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${albumsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              {albumsError ? (
                <div className="text-sm text-red-500">{albumsError}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {albums.map((a) => (
                    <AlbumCard
                      key={a.id}
                      coverUrl={a.coverUrl}
                      title={a.title || a.description || 'アルバム'}
                      onClickCard={() => openAlbum(a.id)}
                      showTopBookmark
                      isBookmarked={albumBookmarkedSet.has(a.id)}
                      onToggleBookmark={(e) => { e.stopPropagation(); toggleAlbumBookmark(a.id) }}
                      bottomMetaVariant="account"
                      accountAvatarUrl={a.owner?.avatarUrl ?? null}
                      accountLabel={a.owner?.username ? `@${a.owner.username}` : (a.owner?.displayName || 'ユーザー')}
                    />
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {showFullscreenVideo && selectedVideo && (
        <VideoFullscreenOverlay
          open={showFullscreenVideo}
          video={{
            id: selectedVideo.id,
            playback_url: selectedVideo.playback_url,
            poster_url: derivePosterUrl(selectedVideo.playback_url, selectedVideo.storage_path),
            title: selectedVideo.title ?? undefined,
            caption: selectedVideo.caption ?? undefined,
          }}
          ownerHandle={selectedOwnerHandle}
          ownerAvatarUrl={selectedOwnerProfile?.avatar_url}
          liked={likedVideoIds.has(selectedVideo.id)}
          likeCount={videoLikeCounts[selectedVideo.id] ?? 0}
          onToggleLike={() => toggleVideoLike(selectedVideo.id)}
          bookmarked={bookmarkedVideoIds.has(selectedVideo.id)}
          onToggleBookmark={() => toggleFavorite(selectedVideo.id)}
          onShare={async () => {
            try {
              const shareData = { title: selectedVideo.title || "動画", url: selectedVideo.playback_url }
              if (navigator.share) await navigator.share(shareData)
              else { await navigator.clipboard.writeText(shareData.url); alert("リンクをコピーしました") }
            } catch {}
          }}
          onClose={() => setShowFullscreenVideo(false)}
          onReserve={() => openReservationForVideo(selectedVideo, { keepFullscreen: true })}
          onMore={() => openStoreDetailForVideo(selectedVideo, { keepFullscreen: true })}
          muted={fullscreenMuted}
          onToggleMuted={() => setFullscreenMuted((prev) => !prev)}
        />
      )}

      {/* Album Viewer Modal */}
      <AlbumViewerOverlay
        open={Boolean(openAlbumId)}
        assets={albumAssets}
        index={albumIndex}
        loading={albumLoading}
        onClose={() => { setOpenAlbumId(null); setAlbumAssets([]); setAlbumIndex(0) }}
        onPrev={() => setAlbumIndex((i) => Math.max(0, i - 1))}
        onNext={() => setAlbumIndex((i) => Math.min(albumAssets.length - 1, i + 1))}
        title={albums.find((a) => a.id === openAlbumId)?.title || albums.find((a) => a.id === openAlbumId)?.description || null}
        ownerAvatarUrl={albums.find((a) => a.id === openAlbumId)?.owner?.avatarUrl ?? null}
        ownerLabel={(() => { const a = albums.find((x) => x.id === openAlbumId); const o = a?.owner; return o?.username ? `@${o.username}` : (o?.displayName || null) })()}
        description={albums.find((a) => a.id === openAlbumId)?.description || null}
        liked={openAlbumId ? albumLikedSet.has(openAlbumId) : false}
        onToggleLike={() => { if (openAlbumId) toggleAlbumLike(openAlbumId) }}
        bookmarked={openAlbumId ? albumBookmarkedSet.has(openAlbumId) : false}
        onToggleBookmark={() => { if (openAlbumId) toggleAlbumBookmark(openAlbumId) }}
      />

      <Navigation />
    </div>
  )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 9.5v5h3.2L12 20V4l-4.3 5.5H4.5z" fill="currentColor" stroke="currentColor" />
      {!muted && (
        <>
          <path d="M15.2 9.2a3.3 3.3 0 010 5.6" />
          <path d="M17.4 7a5.6 5.6 0 010 10" />
        </>
      )}
      {muted && <line x1="16.2" y1="8" x2="21" y2="16" />}
    </svg>
  )
}

// Fullscreen overlay (rendered within the same file component)
// Derive poster URL by swapping extension to .webp (if applicable)
function derivePosterUrl(playbackUrl?: string | null, storagePath?: string | null): string | null {
  if (storagePath) {
    const posterPath = storagePath.replace(/\.[^.]+$/, ".webp")
    if (posterPath && posterPath !== storagePath) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
      if (base) {
        const objectPath = posterPath.replace(/^\/+/, "")
        return `${base}/storage/v1/object/public/videos/${objectPath}`
      }
    }
  }
  if (!playbackUrl) return null
  try {
    const u = new URL(playbackUrl)
    const pathname = u.pathname || ""
    const m = pathname.match(/\.([a-zA-Z0-9]+)$/)
    const ext = (m?.[1] || "").toLowerCase()
    if (!/(mp4|mov|m4v|webm|ogg)$/.test(ext)) return null
    const webpPath = pathname.replace(/\.(mp4|mov|m4v|webm|ogg)$/i, ".webp")
    u.pathname = webpPath
    u.search = ""
    u.hash = ""
    return u.toString()
  } catch {
    const base = playbackUrl?.split?.("?")[0]
    if (base && /\.(mp4|mov|m4v|webm|ogg)$/i.test(base)) {
      return base.replace(/\.(mp4|mov|m4v|webm|ogg)$/i, ".webp")
    }
    return null
  }
}

