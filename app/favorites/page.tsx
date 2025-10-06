"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, User, Play, Bookmark, Share2, Star } from "lucide-react"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"

export default function FavoritesPage() {
  const router = useRouter()
  // Liked videos fetched from DB (video_likes join videos)
  const [likedVideos, setLikedVideos] = useState<
    { id: string; owner_id: string; playback_url: string; title: string | null; caption: string | null; created_at: string }[] | null
  >(null)
  const [likesLoading, setLikesLoading] = useState(true)
  const [needLogin, setNeedLogin] = useState(false)
  const [showLikedVideoFeed, setShowLikedVideoFeed] = useState(false)
  const [selectedLikedIndex, setSelectedLikedIndex] = useState(0)
  const likedFeedRef = useRef<HTMLDivElement | null>(null)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [optimisticDelta, setOptimisticDelta] = useState<Record<string, number>>({})
  const [captionOpenIds, setCaptionOpenIds] = useState<Set<string>>(new Set())
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})

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

  // Scroll to the selected liked video when opening the feed
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
  const [favorites, setFavorites] = useState({
    restaurants: [
      {
        id: 1,
        name: "炭火焼き鳥 とり源",
        genre: "焼肉",
        distance: "0.3km",
        rating: 4.6,
        image: "/placeholder.svg?height=120&width=120",
        videoUrl: FALLBACK_VIDEO_URL,
        favoriteDate: "2024年1月15日",
      },
      {
        id: 2,
        name: "寿司処 海鮮",
        genre: "和食",
        distance: "0.6km",
        rating: 4.8,
        image: "/placeholder.svg?height=120&width=120",
        videoUrl: FALLBACK_VIDEO_URL,
        favoriteDate: "2024年1月12日",
      },
      {
        id: 3,
        name: "イタリアン Trattoria Sole",
        genre: "イタリアン",
        distance: "0.4km",
        rating: 4.3,
        image: "/placeholder.svg?height=120&width=120",
        videoUrl: FALLBACK_VIDEO_URL,
        favoriteDate: "2024年1月10日",
      },
    ],
    videos: [
      {
        id: 1,
        restaurantId: 7,
        restaurantName: "炭火焼き鳥 とり源",
        videoUrl: FALLBACK_VIDEO_URL,
        title: "炭火焼き鳥 とり源のおいしい焼肉",
        description: "炭火で丁寧に焼き上げる絶品焼き鳥！秘伝のタレが決め手です。",
        likes: 1240,
        views: "12.5k",
        user: {
          name: "@tori_gen_official",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        genre: "焼肉",
        distance: "0.3km",
        rating: 4.6,
        favoriteDate: "2024年1月15日",
      },
      {
        id: 2,
        restaurantId: 10,
        restaurantName: "寿司処 海鮮",
        videoUrl: FALLBACK_VIDEO_URL,
        title: "寿司処 海鮮のおいしい寿司",
        description: "新鮮なネタと熟練の技で握る本格江戸前寿司をご覧ください。",
        likes: 2150,
        views: "25.8k",
        user: {
          name: "@kaisenmaster",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        genre: "和食",
        distance: "0.6km",
        rating: 4.8,
        favoriteDate: "2024年1月12日",
      },
      {
        id: 3,
        restaurantId: 15,
        restaurantName: "イタリアン Trattoria Sole",
        videoUrl: FALLBACK_VIDEO_URL,
        title: "イタリアン Trattoria Soleのおいしいパスタ",
        description: "イタリア直輸入の小麦粉で作る手打ちパスタの製作過程をお見せします。",
        likes: 890,
        views: "8.9k",
        user: {
          name: "@chef_mario",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        genre: "イタリアン",
        distance: "0.4km",
        rating: 4.3,
        favoriteDate: "2024年1月10日",
      },
    ],
  })

  const [showVideoFeed, setShowVideoFeed] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
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


  const removeFavoriteRestaurant = (id: number) => {
    setFavorites((prev) => ({
      ...prev,
      restaurants: prev.restaurants.filter((restaurant) => restaurant.id !== id),
    }))
  }

  const removeFavoriteVideo = (id: number) => {
    setFavorites((prev) => ({
      ...prev,
      videos: prev.videos.filter((video) => video.id !== id),
    }))
  }

  const handleVideoClick = (index: number) => {
    setSelectedVideoIndex(index)
    setShowVideoFeed(true)
  }

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
                保存した動画 ({favorites.videos.length})
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
            {favorites.videos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {favorites.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[9/16] relative">
                      <video
                        src={video.videoUrl || FALLBACK_VIDEO_URL}
                        alt={video.restaurantName}
                        className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                        muted
                        loop
                        autoPlay
                        playsInline
                        controls={false}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVideoClick(index)
                        }}
                      />
                      {/* Play button overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVideoClick(index)
                        }}
                      >
                        <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all">
                          <div className="w-0 h-0 border-l-[20px] border-l-gray-800 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFavoriteVideo(video.id)
                        }}
                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-opacity"
                      >
                        <Bookmark className="w-4 h-4 fill-blue-500 text-blue-500" />
                      </button>
                    </div>
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedUser({
                          id: video.restaurantId,
                          name: video.user.name,
                          avatar: video.user.avatar,
                          isFollowing: true,
                        })
                        setShowUserProfile(true)
                      }}
                    >
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {video.restaurantName}のおいしい{video.genre}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-xs text-gray-600">{video.user.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle bookmark
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Bookmark className="w-4 h-4 fill-orange-500 text-orange-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">お気に入りの動画がありません</h3>
                <p className="text-gray-500 mb-4">気になる動画を見つけてお気に入りに追加しましょう</p>
                <button
                  onClick={() => router.push("/reels")}
                  className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
                >
                  動画を見る
                </button>
              </div>
            )}
          </TabsContent>

          
        </Tabs>
      </div>

  {/* Video Feed Modal */}
  {showVideoFeed && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="h-screen overflow-y-auto snap-y snap-mandatory">
            {favorites.videos.map((video, index) => (
              <div key={video.id} className="h-screen w-full relative snap-start">
                <video
                  src={video.videoUrl || FALLBACK_VIDEO_URL}
                  className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                  muted
                  loop
                  autoPlay
                  playsInline
                  controls={false}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedVideoIndex(video.id - 1)
                    setShowVideoFeed(true)
                  }}
                />

                {/* Back button - top left */}
                <div className="absolute top-6 left-6 z-10">
                  <button
                    onClick={() => setShowVideoFeed(false)}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none px-3 py-2 rounded"
                  >
                    ＜
                  </button>
                </div>

                <div className="absolute inset-0 flex">
                  <div className="flex-1 flex flex-col justify-end p-4 pb-24">
                    <div className="text-white">
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              id: video.restaurantId,
                              name: video.user.name,
                              avatar: video.user.avatar,
                              isFollowing: true,
                            })
                            setShowUserProfile(true)
                          }}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                            {video.restaurantName.charAt(0)}
                          </div>
                          <span className="text-white font-semibold">{video.user.name}</span>
                        </button>
                      </div>

                      {/* Instagram-style title */}
                      <div className="mb-3">
                        <h2 className="text-base font-normal leading-relaxed">
                          {video.title}を堪能できる素敵なお店です✨ #グルメ #{video.genre} #美味しい #おすすめ
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Right side buttons - いいね, 保存, シェア only */}
                  <div className="w-16 flex flex-col items-center justify-end pb-24 gap-6">
                    <div className="flex flex-col items-center">
                      <button className="w-12 h-12 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                      </button>
                      <span className="text-white text-xs font-medium drop-shadow-lg mt-1">{video.likes}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <button className="w-12 h-12 flex items-center justify-center">
                        <Bookmark className="w-8 h-8 fill-white text-white drop-shadow-lg" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <button className="w-12 h-12 flex items-center justify-center">
                        <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom buttons - matching video page style */}
                <div className="absolute bottom-6 left-0 right-0 px-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const restaurantData = {
                          id: video.restaurantId,
                          restaurantName: video.restaurantName,
                          restaurantEmail: `info@${video.restaurantName.toLowerCase().replace(/\s+/g, "-")}.com`,
                          genre: video.genre,
                          distance: video.distance,
                          rating: video.rating,
                        }
                        setSelectedRestaurant(restaurantData)
                        setShowReservationModal(true)
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                      今すぐ予約する
                    </button>
                    <button
                      onClick={() => {
                        const restaurantData = {
                          id: video.restaurantId,
                          restaurantName: video.restaurantName,
                          restaurantEmail: `info@${video.restaurantName.toLowerCase().replace(/\s+/g, "-")}.com`,
                          genre: video.genre,
                          distance: video.distance,
                          rating: video.rating,
                        }
                        setSelectedRestaurant(restaurantData)
                        setShowStoreDetailModal(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                      もっと見る…
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  )}

  {/* Liked Videos Feed Modal (full-screen, search-style) */}
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
              onClick={(e) => {
                e.stopPropagation()
                setSelectedLikedIndex(index)
                setShowLikedVideoFeed(true)
              }}
            />

            {/* Back button - top left */}
            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={() => setShowLikedVideoFeed(false)}
                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none px-3 py-2 rounded"
              >
                ＜
              </button>
            </div>

            {/* Left profile overlay (search-style) */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 flex flex-col justify-end p-4 pb-32">
                <div className="text-white">
                  <div className="mb-3">
                    <button
                      onClick={() => { /* open profile modal if needed */ }}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                        {ownerProfiles[v.owner_id]?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
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

            {/* Right side action buttons (like/bookmark/share) */}
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
                <button
                  onClick={() => console.log("bookmark clicked")}
                  className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
                >
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

            {/* Bottom CTA buttons (search-style) */}
            <div className="absolute bottom-16 left-0 right-0 px-4">
              <div className="flex gap-2">
                <button
                  onClick={() => { /* visual only */ }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                >
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

            {/* Bottom overlay for title/caption (toggle by もっと見る…) */}
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

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 h-[90vh] flex flex-col">
            <div className="flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b relative">
                <button onClick={() => setShowUserProfile(false)} className="text-lg">
                  ＜
                </button>
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
                <button
                  className="w-full py-3 font-semibold transition mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded"
                  onClick={() => window.open(`https://instagram.com/${selectedUser.name}`, "_blank")}
                >
                  フォロー中
                </button>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    className="w-full py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50 bg-transparent rounded"
                    onClick={() =>
                      window.open(
                        `https://instagram.com/direct/new/?username=${selectedUser.name.replace("@", "")}`,
                        "_blank",
                      )
                    }
                  >
                    メッセージ
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pb-6">
                <h4 className="font-semibold mb-4">投稿</h4>
                <div className="grid grid-cols-3 gap-1">
                  {favorites.videos.slice(0, 9).map((post, index) => (
                    <div key={index} className="aspect-square relative">
                      <video
                        src={post.videoUrl || FALLBACK_VIDEO_URL}
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

      {/* Reservation Modal */}
      {showReservationModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setShowReservationModal(false)} className="text-lg">
                ＜
              </button>
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
                      setReservationData((prev) => ({
                        ...prev,
                        people: Number.parseInt(e.target.value),
                      }))
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
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setShowStoreDetailModal(false)} className="text-lg">
                ＜
              </button>
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
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">店舗情報</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📍</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">住所</p>
                      <p className="text-sm text-gray-600">東京都渋谷区渋谷1-2-3 渋谷ビル2F</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📞</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">電話番号</p>
                      <p className="text-sm text-gray-600">03-1234-5678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🕒</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">営業時間</p>
                      <p className="text-sm text-gray-600">月〜土: 11:30-14:00, 17:00-23:00</p>
                      <p className="text-sm text-gray-600">日: 11:30-14:00, 17:00-22:00</p>
                      <p className="text-sm text-red-600">定休日: 火曜日</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">💳</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">決済方法</p>
                      <p className="text-sm text-gray-600">現金、QRコード、電子マネー</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🗺️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">アクセス</p>
                      <button
                        onClick={() => window.open("https://maps.google.com", "_blank")}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Googleマップで見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* インフルエンサーの感想 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">紹介したインフルエンサーの感想</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    今回は、コスパ最強の回らない寿司ランチを紹介！
                    <br />
                    <br />
                    ここは1995年から続く老舗のお寿司屋さんで、29年間も愛され続けている。
                    <br />
                    <br />
                    ここはランチでお得にお寿司をいただけて、握りは1人前で880円、1.5人前で1320円で頂けて超お得。
                    <br />
                    <br />
                    目の前で握ってくれる大将はとても気さくで何度も通いたくなる魅力溢れるお店だった！
                    <br />
                    <br />
                    気になった方はぜひ予約してみてね〜⭐️
                  </p>
                </div>
              </div>

              {/* 予約ボタン */}
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
