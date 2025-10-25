"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import VideoCard from "@/components/VideoCard"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import { Heart, User, Play, Bookmark, Send, Star, RefreshCw } from "lucide-react"
// 画像サムネイル生成にSearchと同じ関数を利用
// derivePosterUrl は Search ページ内で定義されているため、同等の処理をここにも定義
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { openReservationForVideo as openReserveShared, openStoreDetailForVideo as openStoreShared } from "@/lib/video-actions"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"
import { useBookmark } from "@/hooks/useBookmark"

interface BookmarkedVideo {
  id: string
  created_at: string
  videos: {
    id: string
    title: string
    category: string
    playback_url: string
    caption: string
    created_at: string
    owner_id: string
  }
}

export default function FavoritesPage() {
  const router = useRouter()
  
  // Liked videos fetched from DB (video_likes join videos)
  const [likedVideos, setLikedVideos] = useState<
    { id: string; owner_id: string; playback_url: string; title: string | null; caption: string | null; created_at: string }[] | null
  >(null)
  const [likesLoading, setLikesLoading] = useState(true)
  
  // Bookmarked videos fetched from DB (video_bookmarks join videos)
  const [bookmarkedVideos, setBookmarkedVideos] = useState<BookmarkedVideo[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [bookmarksError, setBookmarksError] = useState<string | null>(null)
  
  const [needLogin, setNeedLogin] = useState(false)
  const [showLikedVideoFeed, setShowLikedVideoFeed] = useState(false)
  const [showBookmarkedVideoFeed, setShowBookmarkedVideoFeed] = useState(false)
  const [selectedLikedIndex, setSelectedLikedIndex] = useState(0)
  const [selectedBookmarkedIndex, setSelectedBookmarkedIndex] = useState(0)
  const likedFeedRef = useRef<HTMLDivElement | null>(null)
  const bookmarkedFeedRef = useRef<HTMLDivElement | null>(null)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set())
  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [optimisticDelta, setOptimisticDelta] = useState<Record<string, number>>({})
  const [captionOpenIds, setCaptionOpenIds] = useState<Set<string>>(new Set())
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})
  const [fsOpen, setFsOpen] = useState(false)
  const [fsVideo, setFsVideo] = useState<{ id: string; playback_url: string; poster_url?: string | null; title?: string | null; caption?: string | null } | null>(null)
  const [fsOwnerHandle, setFsOwnerHandle] = useState<string>("")
  const [fsOwnerAvatar, setFsOwnerAvatar] = useState<string | null | undefined>(null)
  const [fsMuted, setFsMuted] = useState(false)
  const [bookmarkedMuted, setBookmarkedMuted] = useState(false)
  const [likedMuted, setLikedMuted] = useState(false)

  // Fetch liked videos
  useEffect(() => {
    ;(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
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
        if (!error) setLikedVideos(((data ?? []) as any[]).map((d) => d.videos)) // TODO: 型を詰める
        else setLikedVideos([])
      } catch {
        setLikedVideos([])
      } finally {
        setLikesLoading(false)
      }
    })()
  }, [])

  // Fetch bookmarked videos
  useEffect(() => {
    const fetchBookmarkedVideos = async () => {
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

        const response = await fetch('/api/bookmarks', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'ブックマークの取得に失敗しました')
        }

        const data = await response.json()
        setBookmarkedVideos(data.bookmarks || [])
      } catch (err) {
        console.error('Failed to fetch bookmarked videos:', err)
        setBookmarksError(err instanceof Error ? err.message : 'エラーが発生しました')
        setBookmarkedVideos([])
      } finally {
        setBookmarksLoading(false)
      }
    }

    fetchBookmarkedVideos()
  }, [])

  // Initialize likedSet / like counts / owner profiles once likedVideos load
  useEffect(() => {
    if (!likedVideos || likedVideos.length === 0) {
      setLikedSet(new Set())
      setLikeCounts({})
      setOptimisticDelta({})
      setOwnerProfiles({})
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
          ;(data as any[]).forEach((r) => { // TODO: 型を詰める
            const c = r?.video_likes?.[0]?.count ?? 0
            map[r.id] = c
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
          const map: Record<string, any> = {} // TODO: 型を詰める
          ;(data as any[]).forEach((p) => { // TODO: 型を詰める
            map[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
          })
          setOwnerProfiles(map)
        }
      } catch {}
    })()
  }, [likedVideos])

  // Initialize bookmarked set
  useEffect(() => {
    if (bookmarkedVideos.length > 0) {
      setBookmarkedSet(new Set(bookmarkedVideos.map(bookmark => bookmark.videos.id)))
    }
  }, [bookmarkedVideos])

  useEffect(() => {
    // Keep local set in sync with hook (align with Search)
    if (bookmarkedVideoIds) {
      setBookmarkedSet(new Set(Array.from(bookmarkedVideoIds)))
    }
  }, [bookmarkedVideoIds])

  // Fetch owner profiles for bookmarked videos as well (to show account meta like Search)
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
            ;(data as any[]).forEach((p) => {
              next[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
            })
            return next
          })
        }
      } catch {}
    })()
  }, [bookmarkedVideos])

  const getLikeCount = (id: string) => (likeCounts[id] ?? 0) + (optimisticDelta[id] ?? 0)

  const openOverlayForLiked = (v: { id: string; owner_id: string; playback_url: string; title?: string | null; caption?: string | null }) => {
    const prof = ownerProfiles[v.owner_id]
    const handle = prof?.username ? `@${prof.username}` : (prof?.display_name || "ユーザー")
    setFsVideo({ id: v.id, playback_url: v.playback_url || FALLBACK_VIDEO_URL, poster_url: derivePosterUrl(v.playback_url as any, (v as any).storage_path), title: v.title ?? null, caption: v.caption ?? null })
    setFsOwnerHandle(handle)
    setFsOwnerAvatar(prof?.avatar_url ?? null)
    setFsMuted(false)
    setFsOpen(true)
  }

  const openOverlayForBookmarked = (video: { id: string; owner_id: string; playback_url: string; title?: string | null; caption?: string | null }) => {
    const prof = ownerProfiles[video.owner_id]
    const handle = prof?.username ? `@${prof.username}` : (prof?.display_name || "ユーザー")
    setFsVideo({ id: video.id, playback_url: video.playback_url || FALLBACK_VIDEO_URL, poster_url: derivePosterUrl(video.playback_url as any, (video as any).storage_path), title: video.title ?? null, caption: video.caption ?? null })
    setFsOwnerHandle(handle)
    setFsOwnerAvatar(prof?.avatar_url ?? null)
    setFsMuted(false)
    setFsOpen(true)
  }

  // Remove bookmark function
  const removeBookmark = async (videoId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) return

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      })

      if (response.ok) {
        // 楽観的更新：UIから即座に削除
        setBookmarkedVideos(prev => 
          prev.filter(bookmark => bookmark.videos.id !== videoId)
        )
        setBookmarkedSet(prev => {
          const next = new Set(prev)
          next.delete(videoId)
          return next
        })
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  }

  // 汎用ブックマークトグル（追加・削除）。保存タブと状態を同期
  const toggleBookmarkForVideo = async (video: { id: string; title?: string | null; category?: string | null; playback_url?: string }) => {
    try {
      // Align with Search: delegate to useBookmark hook
      await toggleBookmark(video.id)
      const nowBookmarked = !bookmarkedSet.has(video.id)

      if (nowBookmarked) {
        // 追加（存在しない場合のみ）
        setBookmarkedSet(prev => new Set(prev).add(video.id))
        setBookmarkedVideos(prev => {
          const exists = prev.some(b => b.videos.id === video.id)
          if (exists) return prev
          const next: BookmarkedVideo = {
            id: `local-${video.id}`,
            created_at: new Date().toISOString(),
            videos: {
              id: video.id,
              title: (video.title ?? '').toString(),
              category: ((video as any).category ?? '').toString(),
              playback_url: video.playback_url ?? FALLBACK_VIDEO_URL,
              caption: '',
              created_at: new Date().toISOString(),
              owner_id: ''
            }
          }
          return [next, ...prev]
        })
      } else {
        // 削除
        setBookmarkedSet(prev => {
          const next = new Set(prev)
          next.delete(video.id)
          return next
        })
        setBookmarkedVideos(prev => prev.filter(b => b.videos.id !== video.id))
      }
    } catch (e) {
      console.error('Failed to toggle bookmark:', e)
    }
  }

  // Scroll to the selected video when opening feeds
  useEffect(() => {
    if (showLikedVideoFeed) {
      const container = likedFeedRef.current
      if (container) {
        const children = Array.from(container.children)
        const target = children[selectedLikedIndex] as HTMLElement | undefined
        if (target) target.scrollIntoView({ behavior: "auto", block: "start" })
      }
    }
  }, [showLikedVideoFeed, selectedLikedIndex])

  useEffect(() => {
    if (showBookmarkedVideoFeed) {
      const container = bookmarkedFeedRef.current
      if (container) {
        const children = Array.from(container.children)
        const target = children[selectedBookmarkedIndex] as HTMLElement | undefined
        if (target) target.scrollIntoView({ behavior: "auto", block: "start" })
      }
    }
  }, [showBookmarkedVideoFeed, selectedBookmarkedIndex])

  const handleToggleLikeInFeed = async (id: string) => {
    // Require login
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    const wasLiked = likedSet.has(id)
    // optimistic UI
    setLikedSet((prev) => {
      const s = new Set(prev)
      if (wasLiked) s.delete(id)
      else s.add(id)
      return s
    })
    setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? -1 : +1) }))
    try {
      await toggleLike(id, wasLiked)
      // likedVideosを同期
      setLikedVideos(prev => {
        if (!prev) return prev
        if (wasLiked) {
          return prev.filter(v => v.id !== id)
        }
        return prev
      })
    } catch {
      // rollback on failure
      setLikedSet((prev) => {
        const s = new Set(prev)
        if (wasLiked) s.add(id)
        else s.delete(id)
        return s
      })
      setOptimisticDelta((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? +1 : -1) }))
    }
  }

  // ブックマークフィード上でのいいね（いいねタブへ反映）
  const handleToggleLikeFromBookmarked = async (video: { id: string; owner_id?: string; playback_url?: string; title?: string | null; caption?: string | null; created_at?: string }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    const id = video.id
    const wasLiked = likedSet.has(id)
    setLikedSet(prev => { const s = new Set(prev); wasLiked ? s.delete(id) : s.add(id); return s })
    setOptimisticDelta(prev => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? -1 : +1) }))
    try {
      await toggleLike(id, wasLiked)
      setLikedVideos(prev => {
        const list = prev ?? []
        if (wasLiked) {
          return list.filter(v => v.id !== id)
        } else {
          const exists = list.some(v => v.id === id)
          if (exists) return list
          const next = {
            id,
            owner_id: (video as any).owner_id ?? '',
            playback_url: video.playback_url ?? FALLBACK_VIDEO_URL,
            title: video.title ?? null,
            caption: video.caption ?? null,
            created_at: video.created_at ?? new Date().toISOString()
          }
          return [next, ...list]
        }
      })
    } catch (e) {
      // rollback
      setLikedSet(prev => { const s = new Set(prev); wasLiked ? s.add(id) : s.delete(id); return s })
      setOptimisticDelta(prev => ({ ...prev, [id]: (prev[id] ?? 0) + (wasLiked ? +1 : -1) }))
    }
  }

  // Use shared actions to align behavior with Search
  const mapAnyVideoToRestaurant = undefined as any

  const handleShare = async (url: string) => {
    try {
      if ((navigator as any).share) { // TODO: 型を詰める
        await (navigator as any).share({ url }) // TODO: 型を詰める
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        console.info("Link copied")
      }
    } catch (e) {
      console.warn("share failed", e)
    }
  }

  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null) // TODO: 型を詰める
  // const [showUserProfile, setShowUserProfile] = useState(false) // TODO: 未使用
  // const [selectedUser, setSelectedUser] = useState(null) // TODO: 未使用
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 text-center">
        <h1 className="text-xl font-semibold">お気に入り</h1>
      </div>

      <div className="px-6">
        <Tabs defaultValue="restaurants" className="w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="grid grid-cols-2 bg-transparent h-auto p-0 border-0 w-full">
              <TabsTrigger
                value="restaurants"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                いいねした動画 ({likedVideos?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                保存した動画 ({bookmarkedVideos.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="restaurants" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            {likesLoading ? (
              <div className="py-8 text-center text-gray-500">読み込み中…</div>
            ) : needLogin ? (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ログインが必要です</h3>
                <p className="text-gray-500 mb-4">ログインして、いいねした動画を見ましょう</p>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  ログイン
                </button>
              </div>
            ) : likedVideos && likedVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {likedVideos.map((v) => (
                  <VideoCard
                    key={v.id}
                    posterUrl={derivePosterUrl(v.playback_url, (v as any).storage_path) || FALLBACK_VIDEO_URL}
                    title={v.title || v.caption || '無題の動画'}
                    bottomMetaVariant="account"
                    accountAvatarUrl={ownerProfiles[v.owner_id]?.avatar_url ?? null}
                    accountLabel={ownerProfiles[v.owner_id]?.username ? `@${ownerProfiles[v.owner_id]?.username}` : (ownerProfiles[v.owner_id]?.display_name || 'ユーザー')}
                    showTopBookmark
                    isBookmarked={bookmarkedSet.has(v.id)}
                    onToggleBookmark={() => toggleBookmarkForVideo(v)}
                    onClickCard={() => openOverlayForLiked(v as any)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">いいねした動画がありません</h3>
                <p className="text-gray-500 mb-4">気になる動画を見つけてハートを押しましょう</p>
                <button
                  onClick={() => router.push("/reels")}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  動画を見る
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            {bookmarksLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  ブックマークを読み込み中...
                </div>
              </div>
            ) : bookmarksError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{bookmarksError}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  再試行
                </button>
              </div>
            ) : needLogin ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ログインが必要です</h3>
                <p className="text-gray-500 mb-4">ログインして、保存した動画を見ましょう</p>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  ログイン
                </button>
              </div>
            ) : bookmarkedVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {bookmarkedVideos.map((bookmark) => {
                  const video = bookmark.videos
                  const profile = ownerProfiles[video.owner_id]
                  const label = profile?.username ? `@${profile.username}` : (profile?.display_name || 'ユーザー')
                  return (
                    <VideoCard
                      key={bookmark.id}
                      posterUrl={derivePosterUrl(video.playback_url as any, (video as any).storage_path) || "/placeholder.jpg"}
                      title={video.title || video.caption || '無題の動画'}
                      showTopBookmark
                      isBookmarked
                      onToggleBookmark={() => removeBookmark(video.id)}
                      bottomMetaVariant="account"
                      accountAvatarUrl={profile?.avatar_url ?? null}
                      accountLabel={label}
                      onClickCard={() => openOverlayForBookmarked(video as any)}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">保存した動画がありません</h3>
                <p className="text-gray-500 mb-4">気になる動画を見つけてブックマークしましょう</p>
                <button
                  onClick={() => router.push("/search")}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  動画を探す
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reel feed modals disabled (replaced by VideoFullscreenOverlay) */}

      {/* Unified fullscreen overlay */}
      {fsOpen && fsVideo && (
        <VideoFullscreenOverlay
          open={fsOpen}
          video={fsVideo}
          ownerHandle={fsOwnerHandle}
          ownerAvatarUrl={fsOwnerAvatar ?? null}
          liked={likedSet.has(fsVideo.id)}
          likeCount={getLikeCount(fsVideo.id)}
          onToggleLike={() => handleToggleLikeInFeed(fsVideo.id)}
          bookmarked={bookmarkedSet.has(fsVideo.id)}
          onToggleBookmark={() => toggleBookmarkForVideo({ id: fsVideo.id } as any)}
          onShare={async () => { try { if ((navigator as any).share) { await (navigator as any).share({ url: fsVideo.playback_url }) } else { await navigator.clipboard.writeText(fsVideo.playback_url); alert("リンクをコピーしました") } } catch {} }}
          onClose={() => setFsOpen(false)}
          onReserve={() => { openReserveShared({ setSelectedRestaurant, setShowReservationModal, setShowFullscreenVideo: setFsOpen as any }, { id: fsVideo.id, title: fsVideo.title as any } as any) }}
          onMore={() => { openStoreShared({ setSelectedRestaurant, setShowStoreDetailModal }, { id: fsVideo.id, title: fsVideo.title as any, caption: fsVideo.caption as any } as any, { keepFullscreen: true }) }}
          muted={fsMuted}
          onToggleMuted={() => setFsMuted((m) => !m)}
        />
      )}

      {/* Reservation Modal */}
      {showReservationModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setShowReservationModal(false)} className="text-lg">
                ＜
              </button>
              <h2 className="text-lg font-semibold">お店を予約する</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* お名前 */}
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

              {/* 人数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">人数</label>
                <select
                  value={reservationData.people}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, people: Number.parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>{num}名</option>
                  ))}
                </select>
              </div>

              {/* 日付 */}
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

              {/* 時間帯 */}
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
                    return <option key={timeStr} value={timeStr}>{timeStr}</option>
                  }).filter(Boolean) as any}
                </select>
              </div>

              {/* 席タイプ */}
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

              {/* 送信 */}
              <button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg"
                onClick={() => {
                  alert("予約リクエストを送信しました！")
                  setShowReservationModal(false)
                }}
              >
                予約リクエストを送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Detail Modal */}
      {showStoreDetailModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setShowStoreDetailModal(false)} className="text-lg">
                ＜
              </button>
              <h2 className="text-lg font-semibold">店舗詳細</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
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
                {selectedRestaurant.caption && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRestaurant.caption}</p>
                  </div>
                )}
              </div>

              <button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg"
                onClick={() => {
                  setShowStoreDetailModal(false)
                  setShowReservationModal(true)
                }}
              >
                この店舗を予約する
              </button>
            </div>
          </div>
        </div>
      )}

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

// Searchページと同じロジックで動画URLから推測した.webpのサムネURLを生成
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
    const base = (playbackUrl as any)?.split?.("?")[0]
    if (base && /\.(mp4|mov|m4v|webm|ogg)$/i.test(base)) {
      return base.replace(/\.(mp4|mov|m4v|webm|ogg)$/i, ".webp")
    }
    return null
  }
}
