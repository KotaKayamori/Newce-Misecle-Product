"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X, Bookmark, User, Heart, Send, Star, RefreshCw } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRandomVideos } from "@/hooks/useRandomVideos"
import { mockRestaurants } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"

type SupabaseVideoRow = {
  id: string
  owner_id: string | null
  playback_url: string
  title: string | null
  caption: string | null
  created_at: string
  video_likes?: { count?: number }[]
}

export default function SearchPage() {
  const router = useRouter()
  const { videos, loading, error, fetchVideos, refreshVideos } = useRandomVideos()
  const filters = ["ジャンル", "距離", "空席あり", "予算", "サブスク対応"]
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    形態: [],
    価格帯: [],
    時間帯: [],
    距離: [],
    趣味・嗜好: [],
  })
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState("今日のおすすめ")
  const [showVideoFeed, setShowVideoFeed] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
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
  const [searchTerm, setSearchTerm] = useState("")

  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  const [randomRestaurants, setRandomRestaurants] = useState<any[]>([])
  const [supabaseVideos, setSupabaseVideos] = useState<SupabaseVideoRow[]>([])
  const playersRef = useRef<Record<string, HTMLVideoElement | null>>({})
  const feedPlayersRef = useRef<Record<string, HTMLVideoElement | null>>({})
  const [videoLimit, setVideoLimit] = useState(6)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<SupabaseVideoRow | null>(null)
  const [videoLikeCounts, setVideoLikeCounts] = useState<Record<string, number>>({})
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})
  const [fullscreenMuted, setFullscreenMuted] = useState(false)
  const [videoFeedMuted, setVideoFeedMuted] = useState(false)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)

  // Fullscreen overlay interactions (like/favorite)
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set())
  const likeMutationRef = useRef<Set<string>>(new Set())

  async function toggleVideoLike(videoId: string) {
    if (likeMutationRef.current.has(videoId)) return
    const wasLiked = likedVideoIds.has(videoId)
    likeMutationRef.current.add(videoId)
    try {
      const result = await toggleLike(videoId, wasLiked)
      if ((result as any)?.needLogin) {
        router.push("/auth/login")
        return
      }
      const nowLiked = (result as any)?.liked ?? !wasLiked
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

  function openReservationForVideo(video: SupabaseVideoRow | null) {
    const mapped = mapVideoToRestaurant(video)
    if (!mapped) return
    setSelectedRestaurant(mapped)
    setShowReservationModal(true)
    setShowFullscreenVideo(false)
  }

  function openStoreDetailForVideo(video: SupabaseVideoRow | null) {
    const mapped = mapVideoToRestaurant(video)
    if (!mapped) return
    setSelectedRestaurant(mapped)
    setShowStoreDetailModal(true)
    setShowFullscreenVideo(false)
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
  const videoUrls = [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e4922433bbfa40c89df0a9e1f75192fd-WalYMXOSoRpEM4dikM8ZHQC2pIv6cw.MP4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01128128b91e4216be8e0f1e2eb76d3a-83Mcy3H53RYQLcX9JxsyxoLI9VHH8M.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efc4143cd14b4daabbf86c724c2d911a-TuRbYoAW7DVdz2WGrlJIZXTGk5Tj8K.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecf421d1612b4e9c9d9d18982d9e29c1-PhpTeES7tlpnyhvlVCNGF3WY1AWCBs.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/94ed3b99e81b4f4e861e98fa6a737a05-KCDhmH7BRPUUFsJ3n6bACbv40LgLUA.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0b918043eadc42dbb8a11a8666292e14-MOl0JytZ8z9foz7rwhuYZDR1iWJgOf.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f0ef4e73b2634edc83f0662216afea99-9Wmgb9IlxC1XmLjSFQQ52IbA6PSi7X.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/59c69364867548408e26dc2ce530028f-rsrZkbHGsDOVbLiC9Jk0bYXklUHcNN.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6633e00c4e854a1e9ad7715144d0d4a0-CbfjiPi1ex3Z6G7WqIVv7uNBDVqmqF.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8711c29b4db94231af27d2ec9fac2504-1ivyBR2r1ugGBqyMd4fosbGMRt20gl.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9e218dd5bf174e77a48386174af1272d-2L3LydtHICbzoyeqvMCuFsfe8WXdYw.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8e32fd32a40a4257ad509cfb7a5e7685-PClZMaKQ83B8PTSGT2Xkn5qmEAHZ7W.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cf02561daa5b4af8863d9591ac62645e-CE6tYTu63CWHCCajVlHyYxANJzT4aP.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fb92522435974a5da420115eda3f8a0b-Ug5LtXi1jgInPaP8WqJ2usgrSf5L8a.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6a98071d2ad1460084381913878425ad-c9sgTJjw5Lkvk8kYad58Mks6fi1aPy.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/031fc99b3cb649158886f54bba3bd53b-cHFVNW41aIRIDbU37YiciolgCGxrR9.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/029b03bc9e78498a90e554d11522358c-DzJm5Gxy6PCwoSraWl6M5QbdeaTTFC.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b3b96c6e9aaf4fa4860c5ce5344b8dc3-H21RCMbelIgUirYbPxolPH16qfcz7W.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efc4143cd14b4daabbf86c724c2d911a-IrBeGhEYIEDl7DoPhAnZp45y4voOq4.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01128128b91e4216be8e0f1e2eb76d3a-BJ2LcWGKStXMDp320r6s3jIC9p9366.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e4922433bbfa40c89df0a9e1f75192fd-d17VTvBTfoFxaaqqdH3jOo8qYiChp9.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/94ed3b99e81b4f4e861e98fa6a737a05-CR47nL9G7ql7Z4P96PYNDn4NBydZy8.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecf421d1612b4e9c9d9d18982d9e29c1-bTJ7JdUlEt3Cc4F4Ig9Wl63nGr5qFw.mp4",
  ]

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

  const toggleFavorite = (id: string | number) => {
    const key = String(id)
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleRefreshVideos = () => {
    refreshVideos(selectedCategory, 10)
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
    fetchVideos(selectedCategory, 10)
  }, [selectedCategory, fetchVideos])

  // Load videos from Supabase (initial 6, then +2)
  useEffect(() => {
    ;(async () => {
      try {
        const { data, count, error } = await supabase
          .from("videos")
          .select("id, owner_id, playback_url, title, caption, created_at, video_likes(count)", { count: "exact" })
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
              ;(profileRows as any[]).forEach((p) => {
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
              setLikedVideoIds(new Set((likedRows as any[]).map((r) => r.video_id)))
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
    if (showVideoFeed) {
      setVideoFeedMuted(false)
    }
  }, [showVideoFeed])

  useEffect(() => {
    Object.values(feedPlayersRef.current).forEach((el) => {
      if (!el) return
      el.muted = videoFeedMuted
      if (!videoFeedMuted) {
        try {
          el.volume = 1
          const playPromise = el.play()
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch(() => {})
          }
        } catch {}
      }
    })
  }, [videoFeedMuted])

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

  const selectedOwnerProfile = selectedVideo?.owner_id ? ownerProfiles[selectedVideo.owner_id] : undefined
  const selectedOwnerHandle = selectedOwnerProfile?.username
    ? `@${selectedOwnerProfile.username}`
    : selectedOwnerProfile?.display_name || "ユーザー"

  return (
    <div className="min-h-screen bg-white pb-20 overflow-y-auto scrollbar-hide">
      {/* Search Header */}
      <div className="bg-white px-6 py-4">
        {!isSearchMode ? (
          <div className="flex items-center gap-3 mb-4">
            <div onClick={() => setIsSearchMode(true)} className="flex-1 relative cursor-pointer">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
              <div className="pl-10 pr-4 py-2 border border-black rounded-full bg-white text-black">
                店舗名・ジャンル・キーワードで検索
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
              <Input
                placeholder="店舗名・ジャンル・キーワードで検索"
                className="pl-10 rounded-full border-black text-black placeholder:text-black"
                autoFocus
              />
            </div>
            <Button variant="ghost" onClick={() => setIsSearchMode(false)} className="text-black hover:text-gray-800">
              キャンセル
            </Button>
          </div>
        )}

        {/* Category Tabs - only show when not in search mode */}
        {!isSearchMode && (
          <div className="mb-4">
            <div className="flex overflow-x-auto scrollbar-hide pb-2 gap-1">
              {["今日のおすすめ", "今人気のお店", "SNSで人気のお店", "Z世代に人気のお店", "デートにおすすめのお店"].map(
                (category, index) => (
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

      {/* Video Feed Modal - DBから取得した動画を使用 */}
      {showVideoFeed && (
        <div className="fixed inset-0 z-40 bg-black">
          <div className="h-screen overflow-y-auto snap-y snap-mandatory">
            {videos.map((video, index) => (
              <div key={video.id} className="h-screen w-full relative snap-start">
                <video
                  ref={(el) => {
                    if (el) feedPlayersRef.current[video.id] = el
                    else delete feedPlayersRef.current[video.id]
                  }}
                  src={video.public_url}
                  className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                  muted={videoFeedMuted}
                  loop
                  autoPlay
                  playsInline
                  controls={false}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedVideoIndex(index)
                    setShowVideoFeed(true)
                  }}
                />

                {/* Back button - top left */}
                <div className="absolute top-6 left-6 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVideoFeed(false)}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
                  >
                    ＜
                  </Button>
                </div>

                <div className="absolute top-6 right-6 z-10">
                  <button
                    type="button"
                    onClick={() => setVideoFeedMuted((prev) => !prev)}
                    className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
                    aria-label={videoFeedMuted ? "ミュート解除" : "ミュートにする"}
                  >
                    <SpeakerIcon muted={videoFeedMuted} />
                  </button>
                </div>

                <div className="absolute inset-0 flex">
                  <div className="flex-1 flex flex-col justify-end p-4 pb-32">
                    <div className="text-white">
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              id: video.user.id,
                              name: `@${video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}`,
                              avatar: video.user.avatar_url,
                              isFollowing: favorites.has(String(video.id)),
                            })
                            setShowUserProfile(true)
                          }}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
                            {video.user.avatar_url ? (
                              <img 
                                src={video.user.avatar_url} 
                                alt={video.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              video.user.name.charAt(0)
                            )}
                          </div>
                          <span className="text-white font-semibold text-sm">
                            @{video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}
                          </span>
                        </button>
                      </div>
                      
                      {/* 動画タイトル表示 */}
                      <div className="mb-2">
                        <p className="text-white text-sm">{video.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right side buttons */}
                  <div className="w-16 flex flex-col items-center justify-center pb-32 gap-6">
                    <div className="flex flex-col items-center">
                      <button className="w-12 h-12 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                      </button>
                      <span className="text-white text-xs font-medium drop-shadow-lg mt-1">128</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => toggleFavorite(video.id)}
                        className="w-12 h-12 flex items-center justify-center"
                      >
                        <Bookmark
                          className={`w-8 h-8 drop-shadow-lg ${
                            favorites.has(String(video.id)) ? "fill-white text-white" : "text-white"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <button className="w-12 h-12 flex items-center justify-center">
                        <Send className="w-8 h-8 text-white drop-shadow-lg" />
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
                          restaurantName: video.title,
                          restaurantEmail: `info@${video.title.toLowerCase().replace(/\s+/g, "-")}.com`,
                          genre: video.category,
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
                          restaurantName: video.title,
                          restaurantEmail: `info@${video.title.toLowerCase().replace(/\s+/g, "-")}.com`,
                          genre: video.category,
                          distance: "0.5km",
                          rating: 4.5,
                          storeInfo: video.store_info,
                          influencerComment: video.influencer_comment,
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
                  onClick={() => {
                    if (selectedUser.isFollowing) {
                      toggleFavorite(selectedUser.id)
                      setSelectedUser({
                        ...selectedUser,
                        isFollowing: !selectedUser.isFollowing,
                      })
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
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="text-gray-500">動画を読み込み中...</div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center py-8">
                  <div className="text-red-500 mb-2">エラーが発生しました</div>
                  <button
                    onClick={handleRefreshVideos}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    再試行
                  </button>
                </div>
              )}

              {/* 2x3 Grid Layout - DBから取得した動画 */}
              {!loading && !error && (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/restaurant/${video.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[9/16] relative">
                          <video
                            src={video.public_url}
                            alt={video.title}
                            className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                            muted
                            loop
                            autoPlay
                            playsInline
                            controls={false}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVideoIndex(videos.findIndex(v => v.id === video.id))
                              setShowVideoFeed(true)
                            }}
                          />
                          {/* Play button overlay */}
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVideoIndex(videos.findIndex(v => v.id === video.id))
                              setShowVideoFeed(true)
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
                              id: video.user.id,
                              name: `@${video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}`,
                              avatar: video.user.avatar_url,
                              isFollowing: favorites.has(String(video.id)),
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
                                  <img 
                                    src={video.user.avatar_url} 
                                    alt={video.user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">
                                @{video.user.username || video.user.name.toLowerCase().replace(/\s+/g, "_")}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(video.id)
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${
                                  favorites.has(String(video.id)) ? "fill-orange-500 text-orange-500" : "text-gray-600"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && videos.length === 0 && (
                <div className="flex flex-col items-center py-8">
                  <div className="text-gray-500 mb-2">動画が見つかりませんでした</div>
                  <button
                    onClick={handleRefreshVideos}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    再読み込み
                  </button>
                </div>
              )}
            </div>

            {/* Supabase videos list (play on demand) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">最新動画</h2>
                <span className="text-sm text-gray-600">{supabaseVideos.length}件</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {supabaseVideos.map((v) => {
                  const ownerProfile = v.owner_id ? ownerProfiles[v.owner_id] : undefined
                  const ownerHandle = ownerProfile?.username
                    ? `@${ownerProfile.username}`
                    : ownerProfile?.display_name || "ユーザー"
                  const isFavorite = favorites.has(String(v.id))

                  return (
                    <Card
                      key={v.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      aria-label={`動画を全画面で表示（${v.title || "動画"}）`}
                      title="動画を全画面で表示"
                      onClick={() => {
                        setSelectedVideo({ ...v })
                        setShowFullscreenVideo(true)
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[9/16] relative">
                          <video
                            ref={(el) => (playersRef.current[v.id] = el)}
                            src={v.playback_url}
                            className="w-full h-full object-cover rounded-t-lg cursor-pointer"
                            poster={derivePosterUrl(v.playback_url) || "/placeholder.jpg"}
                            muted
                            playsInline
                            preload="metadata"
                            controls={false}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVideo({ ...v })
                              setShowFullscreenVideo(true)
                            }}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVideo({ ...v })
                              setShowFullscreenVideo(true)
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
                              id: v.owner_id || v.id,
                              name: ownerHandle,
                              avatar: ownerProfile?.avatar_url,
                              isFollowing: isFavorite,
                            })
                            setShowUserProfile(true)
                          }}
                        >
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{v.title || "動画"}</h3>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                {ownerProfile?.avatar_url ? (
                                  <img src={ownerProfile.avatar_url} alt={ownerHandle} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">{ownerHandle}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(v.id)
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Bookmark
                                className={`w-4 h-4 ${isFavorite ? "fill-orange-500 text-orange-500" : "text-gray-600"}`}
                              />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              {hasMoreVideos && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setVideoLimit((prev) => prev + 2)}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors"
                    aria-label="さらに読み込む"
                    title="さらに読み込む"
                  >
                    さらに読み込む（+2件）
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFullscreenVideo && selectedVideo && (
        <div className="fixed inset-0 z-40 bg-black">
          <video
            ref={fullscreenVideoRef}
            src={selectedVideo.playback_url}
            className="w-full h-full object-cover"
            poster={derivePosterUrl(selectedVideo.playback_url) || "/placeholder.jpg"}
            muted
            loop
            autoPlay
            playsInline
            {...{ 'webkit-playsinline': 'true' }}
            preload="auto"
            controls={false}
          />

          <div className="absolute top-6 left-6 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const el = fullscreenVideoRef.current
                if (el) {
                  try {
                    el.pause()
                  } catch {}
                }
                setShowFullscreenVideo(false)
              }}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
            >
              ＜
            </Button>
          </div>

          <div className="absolute top-6 right-6 z-10">
            <button
              type="button"
              onClick={() => setFullscreenMuted((prev) => !prev)}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
              aria-label={fullscreenMuted ? "ミュート解除" : "ミュートにする"}
            >
              <SpeakerIcon muted={fullscreenMuted} />
            </button>
          </div>

          <div className="absolute inset-0 flex">
            <div className="flex-1 flex flex-col justify-end p-4 pb-32">
              <div className="text-white">
                <div className="mb-3">
                  <button
                    onClick={() => {
                      setSelectedUser({
                        id: selectedVideo.owner_id || selectedVideo.id,
                        name: selectedOwnerHandle,
                        avatar: selectedOwnerProfile?.avatar_url,
                        isFollowing: favorites.has(String(selectedVideo.id)),
                      })
                      setShowUserProfile(true)
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
                      {selectedOwnerProfile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedOwnerProfile.avatar_url} alt={selectedOwnerHandle} className="w-full h-full object-cover" />
                      ) : (
                        selectedOwnerHandle.trim().replace(/^@/, "").charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <span className="text-white font-semibold text-sm">{selectedOwnerHandle}</span>
                  </button>
                </div>

                {selectedVideo.title && (
                  <div className="mb-2">
                    <p className="text-white text-sm">{selectedVideo.title}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-16 flex flex-col items-center justify-center pb-32 gap-6">
              <div className="flex flex-col items-center">
                <button
                  className="w-12 h-12 flex items-center justify-center"
                  onClick={() => toggleVideoLike(selectedVideo.id)}
                  aria-label={likedVideoIds.has(selectedVideo.id) ? "いいね解除" : "いいね"}
                >
                  <Heart className={`w-8 h-8 text-white drop-shadow-lg ${likedVideoIds.has(selectedVideo.id) ? "fill-red-500 text-red-500" : ""}`} />
                </button>
                <span className="text-white text-xs font-medium drop-shadow-lg mt-1">
                  {videoLikeCounts[selectedVideo.id] ?? 0}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => toggleFavorite(selectedVideo.id)}
                  className="w-12 h-12 flex items-center justify-center"
                  aria-label={favorites.has(String(selectedVideo.id)) ? "お気に入り解除" : "お気に入り"}
                >
                  <Bookmark
                    className={`w-8 h-8 drop-shadow-lg ${favorites.has(String(selectedVideo.id)) ? "fill-white text-white" : "text-white"}`}
                  />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <button
                  className="w-12 h-12 flex items-center justify-center"
                  onClick={async () => {
                    try {
                      const shareData = { title: selectedVideo.title || "動画", url: selectedVideo.playback_url }
                      if (navigator.share) await navigator.share(shareData)
                      else {
                        await navigator.clipboard.writeText(shareData.url)
                        // eslint-disable-next-line no-alert
                        alert("リンクをコピーしました")
                      }
                    } catch {}
                  }}
                  aria-label="共有"
                >
                  <Send className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-16 left-0 right-0 px-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openReservationForVideo(selectedVideo)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                今すぐ予約する
              </button>
              <button
                type="button"
                onClick={() => openStoreDetailForVideo(selectedVideo)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                もっと見る…
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

// Fullscreen overlay (rendered within the same file component)
// Derive poster URL by swapping extension to .webp (if applicable)
function derivePosterUrl(playbackUrl: string): string | null {
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
    if (/\.(mp4|mov|m4v|webm|ogg)$/i.test(playbackUrl.split('?')[0])) {
      return playbackUrl.split('?')[0].replace(/\.(mp4|mov|m4v|webm|ogg)$/i, ".webp")
    }
    return null
  }
}
