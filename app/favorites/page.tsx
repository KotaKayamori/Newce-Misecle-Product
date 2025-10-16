"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, User, Play, Bookmark, Share2, Star, RefreshCw } from "lucide-react"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"

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
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [optimisticDelta, setOptimisticDelta] = useState<Record<string, number>>({})
  const [captionOpenIds, setCaptionOpenIds] = useState<Set<string>>(new Set())
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})

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
        if (!error) setLikedVideos(((data ?? []) as any[]).map((d) => d.videos))
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
          ;(data as any[]).forEach((r) => {
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
          const map: Record<string, any> = {}
          ;(data as any[]).forEach((p) => {
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

  const handleShare = async (url: string) => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ url })
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
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
              <div className="grid grid-cols-2 gap-4">
                {likedVideos.map((v, idx) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedLikedIndex(idx)
                      setShowLikedVideoFeed(true)
                    }}
                  >
                    <div className="relative aspect-[9/16] bg-black">
                      <video
                        src={v.playback_url || FALLBACK_VIDEO_URL}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        controls={false}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow">
                          <div className="w-0 h-0 border-l-[16px] border-l-gray-800 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-xs font-medium line-clamp-1">{v.title || ""}</p>
                      </div>
                    </div>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                {bookmarkedVideos.map((bookmark, index) => {
                  const video = bookmark.videos
                  return (
                    <div
                      key={bookmark.id}
                      className="bg-white rounded-lg overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[9/16] relative">
                        <video
                          src={video.playback_url || FALLBACK_VIDEO_URL}
                          aria-label={video.title || '動画'}
                          className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                          muted
                          loop
                          autoPlay
                          playsInline
                          controls={false}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBookmarkedIndex(index)
                            setShowBookmarkedVideoFeed(true)
                          }}
                        />
                        {/* Play button overlay */}
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBookmarkedIndex(index)
                            setShowBookmarkedVideoFeed(true)
                          }}
                        >
                          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all">
                            <div className="w-0 h-0 border-l-[20px] border-l-gray-800 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                        
                        {/* Remove bookmark button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBookmark(video.id)
                          }}
                          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-opacity"
                        >
                          <Bookmark className="w-4 h-4 fill-blue-500 text-blue-500" />
                        </button>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                          {video.title || video.caption || '無題の動画'}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-xs text-gray-600">
                              {new Date(bookmark.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBookmark(video.id)
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Bookmark className="w-4 h-4 fill-orange-500 text-orange-500" />
                          </button>
                        </div>
                      </div>
                    </div>
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

      {/* Bookmarked Videos Feed Modal */}
      {showBookmarkedVideoFeed && bookmarkedVideos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black">
          <div ref={bookmarkedFeedRef as any} className="h-screen overflow-y-auto snap-y snap-mandatory">
            {bookmarkedVideos.map((bookmark, index) => {
              const video = bookmark.videos
              return (
                <div key={bookmark.id} className="h-screen w-full relative snap-start">
                  <video
                    src={video.playback_url || FALLBACK_VIDEO_URL}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                    controls={false}
                  />

                  {/* Back button */}
                  <div className="absolute top-6 left-6 z-10">
                    <button
                      onClick={() => setShowBookmarkedVideoFeed(false)}
                      className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none px-3 py-2 rounded"
                    >
                      ＜
                    </button>
                  </div>

                  {/* Video info */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 flex flex-col justify-end p-4 pb-32">
                      <div className="text-white">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold mb-2">
                            {video.title || video.caption || '無題の動画'}
                          </h3>
                          <p className="text-sm text-gray-300">
                            保存日: {new Date(bookmark.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right side buttons */}
                    <div className="w-16 flex flex-col items-center justify-end pb-20 gap-6">
                      <div className="flex flex-col items-center">
                        <button className="w-12 h-12 flex items-center justify-center">
                          <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => removeBookmark(video.id)}
                          className="w-12 h-12 flex items-center justify-center"
                        >
                          <Bookmark className="w-8 h-8 text-white drop-shadow-lg fill-white" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => handleShare(video.playback_url)}
                          className="w-12 h-12 flex items-center justify-center"
                        >
                          <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom buttons */}
                  <div className="absolute bottom-16 left-0 right-0 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const restaurantData = {
                            id: video.id,
                            restaurantName: video.title || '店舗名',
                            genre: video.category || '料理',
                            distance: "0.5km",
                            rating: 4.5,
                          }
                          setSelectedRestaurant(restaurantData)
                          setShowReservationModal(true)
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                      >
                        今すぐ予約する
                      </button>
                      <button
                        onClick={() => {
                          const restaurantData = {
                            id: video.id,
                            restaurantName: video.title || '店舗名',
                            genre: video.category || '料理',
                            distance: "0.5km",
                            rating: 4.5,
                          }
                          setSelectedRestaurant(restaurantData)
                          setShowStoreDetailModal(true)
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                      >
                        もっと見る…
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 既存のLiked Videos Feed Modal */}
      {showLikedVideoFeed && likedVideos && (
        <div className="fixed inset-0 z-50 bg-black">
          <div ref={likedFeedRef as any} className="h-screen overflow-y-auto snap-y snap-mandatory">
            {likedVideos.map((v, index) => (
              <div key={v.id} className="h-screen w-full relative snap-start">
                <video
                  src={v.playback_url || FALLBACK_VIDEO_URL}
                  className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                  muted
                  loop
                  autoPlay
                  playsInline
                  controls={false}
                />

                {/* Back button */}
                <div className="absolute top-6 left-6 z-10">
                  <button
                    onClick={() => setShowLikedVideoFeed(false)}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none px-3 py-2 rounded"
                  >
                    ＜
                  </button>
                </div>

                {/* Left profile overlay */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 flex flex-col justify-end p-4 pb-32">
                    <div className="text-white">
                      <div className="mb-3">
                        <button
                          onClick={() => {}}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                            {ownerProfiles[v.owner_id]?.avatar_url ? (
                              <img
                                src={ownerProfiles[v.owner_id]?.avatar_url as string}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-700 font-semibold">
                                {(ownerProfiles[v.owner_id]?.username || ownerProfiles[v.owner_id]?.display_name || "U").toString().charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-white font-semibold text-sm">
                            {ownerProfiles[v.owner_id]?.username
                              ? `@${ownerProfiles[v.owner_id]?.username}`
                              : ownerProfiles[v.owner_id]?.display_name || "ユーザー"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side action buttons */}
                <div className="absolute right-4 bottom-28 z-10 flex flex-col items-center gap-5">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleToggleLikeInFeed(v.id)}
                      className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                    >
                      <Heart className={`w-6 h-6 ${likedSet.has(v.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                    </button>
                    <span className="text-white text-xs mt-1">
                      {(likeCounts[v.id] ?? 0) + (optimisticDelta[v.id] ?? 0)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleShare(v.playback_url)}
                      className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                    >
                      <Share2 className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Bottom CTA buttons */}
                <div className="absolute bottom-16 left-0 right-0 px-4">
                  <div className="flex gap-2">
                    <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
                      今すぐ予約する
                    </button>
                    <button
                      onClick={() => {
                        setCaptionOpenIds((prev) => {
                          const s = new Set(prev)
                          if (s.has(v.id)) s.delete(v.id)
                          else s.add(v.id)
                          return s
                        })
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                    >
                      もっと見る…
                    </button>
                  </div>
                </div>

                {/* Bottom overlay for title/caption */}
                {captionOpenIds.has(v.id) && (
                  <div className="absolute inset-x-0 bottom-28 px-4">
                    <div className="bg-black/50 rounded-xl p-3">
                      <p className="text-white text-sm font-medium whitespace-pre-wrap">{v.title || ""}</p>
                      {v.caption && <p className="text-white/90 text-xs mt-1 whitespace-pre-wrap">{v.caption}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
