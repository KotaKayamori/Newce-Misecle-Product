"use client"

import Navigation from "@/components/navigation"
import { FilterModal } from "./components/modals/FilterModal"
import { UserProfileModal } from "./components/modals/UserProfileModal"
import { StoreDetailModal } from "./components/modals/StoreDetailModal"
import { ReservationModal } from "./components/modals/ReservationModal"
import { SearchControls } from "./components/SearchControls"
import { SearchResultsSection } from "./components/SearchResultsSection"
import { CategoryVideosSection } from "./components/CategoryVideosSection"
import { LatestVideosSection } from "./components/LatestVideosSection"
import { GuidebookSection } from "./components/GuidebookSection"
import { derivePosterUrl } from "./utils"
import { useFilters } from "./hooks/useFilters"
import { useSearchVideos } from "./hooks/useSearchVideos"
import { useAlbums } from "./hooks/useAlbums"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useRandomVideos, type VideoData } from "@/hooks/useRandomVideos"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"
import {
  openReservationForVideo as openReserveShared,
  openStoreDetailForVideo as openStoreShared,
  normalizeOptionalText,
} from "@/lib/video-actions"
import { useBookmark } from "@/hooks/useBookmark"
import AlbumViewerOverlay from "../../components/AlbumViewerOverlay"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import ReelsScreen from "@/screens/ReelsScreen"
import type { RestaurantInfo } from "./types"

type SupabaseVideoRow = {
  id: string
  owner_id: string | null
  playback_url: string
  storage_path: string | null
  title: string | null
  caption: string | null
  created_at: string
  video_likes?: { count?: number }[]
  store_1_name?: string | null
  store_1_tel?: string | null
  store_1_tabelog?: string | null
  store_2_name?: string | null
  store_2_tel?: string | null
  store_2_tabelog?: string | null
  store_3_name?: string | null
  store_3_tel?: string | null
  store_3_tabelog?: string | null
}

const CATEGORY_SLUG_MAP: Record<string, string> = {
  "あなたにおすすめ": "today_recommended",
  "人気急上昇中のお店": "popular_now",
  "SNSで人気のお店": "sns_popular",
  "若年層に人気のお店": "gen_z_popular",
  "デートにおすすめ": "date_recommended",
  "デートにおすすめのお店": "date_recommended",
}

function resolveCategorySlug(category?: string | null) {
  if (!category) return undefined
  return CATEGORY_SLUG_MAP[category] ?? category
}

export default function SearchPage() {
  const router = useRouter()
  const { videos, loading, error, fetchVideos, refreshVideos } = useRandomVideos()
  
  // Custom hooks
  const filters = useFilters()
  const search = useSearchVideos()
  
  const [showFilters, setShowFilters] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [_expandedCategory, _setExpandedCategory] = useState<string | null>(null) // TODO: 未使用
  const categoryTabs = [
    "あなたにおすすめ",
    "人気急上昇中のお店",
    "SNSで人気のお店",
    "若年層に人気のお店",
    "デートにおすすめのお店",
    "最新動画",
    "ガイドブック",
  ]
  const [selectedCategory, setSelectedCategory] = useState("あなたにおすすめ")
  const isLatestCategory = selectedCategory === "最新動画"
  const isGuidebookCategory = selectedCategory === "ガイドブック"
  
  // Albums hook
  const albums = useAlbums(isGuidebookCategory)
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
  const allPopularKeywords = [
    "和食", "イタリアン", "焼肉", "寿司", "ラーメン",
    "カフェ", "居酒屋", "フレンチ", "中華", "韓国料理",
    "パスタ", "ピザ", "うどん", "そば", "天ぷら",
    "ハンバーガー", "インド料理", "スペイン料理", "カレー",
    "ステーキ", "しゃぶしゃぶ", "お好み焼き", "たこ焼き", "串カツ",
    "ビュッフェ", "バイキング", "スイーツ", "パンケーキ", "テイクアウト",
    "バー", "ワイン", "日本酒", "クラフトビール", "ヴィーガン",
    "個室", "食べ放題", "ランチ", "ディナー",
  ]

  // ★ ランダムで選んだ10個の index を保持
  const [popularKeywordIndexes, setPopularKeywordIndexes] = useState<number[]>([])

  // 初回マウント時にランダム10個を選ぶ
  useEffect(() => {
    if (allPopularKeywords.length === 0) return
    const shuffled = [...allPopularKeywords.keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
    setPopularKeywordIndexes(shuffled)
  }, []) // 初回のみ

  // UI で使う 10 個だけを算出
  const popularKeywordsForUi = useMemo(
    () => popularKeywordIndexes.map((i) => allPopularKeywords[i]),
    [popularKeywordIndexes, allPopularKeywords],
  )

  const handlePopularKeywordsRefresh = () => {
    if (allPopularKeywords.length === 0) return
    const shuffled = [...allPopularKeywords.keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
    setPopularKeywordIndexes(shuffled)
  }

  const handleKeywordSelect = async (keyword: string) => {
    setSearchTerm(keyword)
    setIsSearchMode(false)
    await search.performSearch(keyword)
  }

  // タブ切り替え時に検索結果をクリアするハンドラ
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category)
    // 検索状態をクリア
    setSearchTerm("")
    setIsSearchMode(false)
    search.clearSearch()
  }

  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantInfo | null>(null)
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<SupabaseVideoRow | null>(null)
  const [showReelsFromSearch, setShowReelsFromSearch] = useState(false)
  const [videoLikeCounts, setVideoLikeCounts] = useState<Record<string, number>>({})
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>>({})
  const [fullscreenMuted, setFullscreenMuted] = useState(false)
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fullscreenScrollLockRef = useRef<{
    scrollY: number
    body: { top: string; position: string; overflow: string; width: string; left: string; right: string }
  } | null>(null)

  const openSingleFullscreen = (video: SupabaseVideoRow) => {
    setSelectedVideo({
      ...video,
      caption: normalizeOptionalText(video.caption) ?? null,
    })
    setShowReelsFromSearch(false)
    setShowFullscreenVideo(true)
  }

  const selectSupabaseVideo = (video: SupabaseVideoRow) => {
    if (isGuidebookCategory) {
      openSingleFullscreen(video)
      return
    }
    setSelectedVideo({
      ...video,
      caption: normalizeOptionalText(video.caption) ?? null,
    })
    setShowFullscreenVideo(false)
    setShowReelsFromSearch(true)
  }

  // Fullscreen overlay interactions (like/favorite)
  const [likedVideoIds, setLikedVideoIds] = useState<Set<string>>(new Set())
  const likeMutationRef = useRef<Set<string>>(new Set())
  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()


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
  
  function openReservationForVideo(video: SupabaseVideoRow | null, options?: { keepFullscreen?: boolean }) {
    openReserveShared({ setSelectedRestaurant, setShowReservationModal, setShowFullscreenVideo }, video as any, options)
  }

  function openStoreDetailForVideo(video: SupabaseVideoRow | null, options?: { keepFullscreen?: boolean }) {
    if (!video) return
    const owner = video.owner_id ? ownerProfiles[video.owner_id] : null
    const ownerLabel = owner?.username ? `@${owner.username}` : owner?.display_name ?? null
    const videoWithOwner = owner
      ? {
          ...video,
          owner_label: ownerLabel,
          owner_avatar_url: owner?.avatar_url ?? null,
        }
      : video
    openStoreShared({ setSelectedRestaurant, setShowStoreDetailModal, setShowFullscreenVideo }, videoWithOwner as any, options)
  }

  function openRandomVideoFullscreen(video: VideoData) {
    const playbackUrl = video.public_url
    if (!playbackUrl) return

    if (video.user?.id) {
      setOwnerProfiles((prev) => {
        const existing = prev[video.user!.id!]
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
        return { ...prev, [video.user!.id!]: nextProfile }
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
      store_1_name: video.store_1_name ?? null,
      store_1_tel: video.store_1_tel ?? null,
      store_1_tabelog: video.store_1_tabelog ?? null,
      store_2_name: video.store_2_name ?? null,
      store_2_tel: video.store_2_tel ?? null,
      store_2_tabelog: video.store_2_tabelog ?? null,
      store_3_name: video.store_3_name ?? null,
      store_3_tel: video.store_3_tel ?? null,
      store_3_tabelog: video.store_3_tabelog ?? null,
    })
    setShowReelsFromSearch(true)
  }

  async function handleSearchSubmit() {
    if (!searchTerm.trim()) return
    setIsSearchMode(false)
    const result = await search.performSearch(searchTerm)

    if (result && result.videos && result.videos.length > 0) {
      // いいね数を反映
      setVideoLikeCounts((prev) => {
        const next = { ...prev }
        result.videos.forEach((row) => {
          next[row.id] = row.video_likes?.[0]?.count ?? next[row.id] ?? 0
        })
        return next
      })

      // オーナープロフィールを取得
      const ownerIds = Array.from(new Set(result.videos.map((row) => row.owner_id).filter((id): id is string => Boolean(id))))
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
    }
  }

  function handleClearSearch() {
    setSearchTerm("")
    search.clearSearch()
    setIsSearchMode(false)
  }

  // When opening fullscreen, ensure playback state is updated
  useEffect(() => {
    if (showFullscreenVideo && selectedVideo) {
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
    const categorySlug = selectedCategory === "あなたにおすすめ" ? undefined : resolveCategorySlug(selectedCategory)
    refreshVideos(categorySlug, 10)
  }

  const handleRefreshAlbums = albums.refreshAlbums

  useEffect(() => {
    if (selectedCategory === "最新動画" || selectedCategory === "ガイドブック") return
    const categorySlug = selectedCategory === "あなたにおすすめ" ? undefined : resolveCategorySlug(selectedCategory)
    fetchVideos(categorySlug, 10)
  }, [selectedCategory, fetchVideos])


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

    const shouldLock = showFullscreenVideo || showReelsFromSearch
    if (shouldLock) {
      fullscreenScrollLockRef.current = {
        scrollY: window.scrollY,
        body: {
          top: bodyStyle.top,
          position: bodyStyle.position,
          overflow: bodyStyle.overflow,
          width: bodyStyle.width,
          left: bodyStyle.left,
          right: bodyStyle.right,
        },
      }
      bodyStyle.top = `-${window.scrollY}px`
      bodyStyle.position = "fixed"
      bodyStyle.overflow = "hidden"
      bodyStyle.left = "0"
      bodyStyle.right = "0"
      bodyStyle.width = "100%"
    } else if (fullscreenScrollLockRef.current) {
      const previous = fullscreenScrollLockRef.current
      bodyStyle.top = previous.body.top
      bodyStyle.position = previous.body.position
      bodyStyle.overflow = previous.body.overflow
      bodyStyle.width = previous.body.width
      bodyStyle.left = previous.body.left
      bodyStyle.right = previous.body.right
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
        bodyStyle.left = previous.body.left
        bodyStyle.right = previous.body.right
        window.scrollTo({ top: previous.scrollY })
        fullscreenScrollLockRef.current = null
      }
    }
  }, [showFullscreenVideo, showReelsFromSearch])

  const selectedOwnerProfile = selectedVideo?.owner_id ? ownerProfiles[selectedVideo.owner_id] : undefined
  const selectedOwnerHandle = selectedOwnerProfile?.username
    ? `@${selectedOwnerProfile.username}`
    : (selectedOwnerProfile?.display_name || "ユーザー");

  return (
   <div className="min-h-screen bg-white pb-20 scrollbar-hide">
      <SearchControls
        isSearchMode={isSearchMode}
        didSearch={search.didSearch}
        searchTerm={searchTerm}
        searchLoading={search.searchLoading}
        categories={categoryTabs}
        selectedCategory={selectedCategory}
        popularKeywordsSets={popularKeywordsForUi}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onSearchModeChange={setIsSearchMode}
        onClearSearch={handleClearSearch}
        onSelectCategory={handleSelectCategory}
        onPopularKeywordsRefresh={handlePopularKeywordsRefresh}
        onKeywordSelect={handleKeywordSelect}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        open={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={selectedUser}
        videos={videos}
        onToggleFollow={toggleFavorite}
      />

      {/* Filter Modal */}
      <FilterModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFilters={filters.selectedFilters}
        selectedFilterCategory={filters.selectedFilterCategory}
        onSelectCategory={filters.setSelectedFilterCategory}
        onFilterToggle={filters.handleFilterToggle}
        onClearAll={filters.clearAllFilters}
        getTotalSelectedCount={filters.getTotalSelectedCount}
        getSelectedCount={filters.getSelectedCount}
      />

      {/* Reservation Modal */}
      <ReservationModal
        open={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        restaurant={selectedRestaurant}
        reservationData={reservationData}
        onReservationDataChange={(data) => setReservationData((prev) => ({ ...prev, ...data }))}
        onSubmit={() => {
                  alert("予約リクエストを送信しました！")
                  setShowReservationModal(false)
                }}
      />

      {/* Store Detail Modal */}
      <StoreDetailModal
        open={showStoreDetailModal}
        onClose={() => setShowStoreDetailModal(false)}
        restaurant={selectedRestaurant}
        onReserve={() => {
                  setShowStoreDetailModal(false)
                  setShowReservationModal(true)
                }}
      />

      {!isSearchMode && (
        <div className="px-6 py-4 bg-white overflow-y-auto scrollbar-hide">
          <div className="space-y-6">
            <SearchResultsSection
              visible={search.didSearch}
              searchTerm={searchTerm}
              loading={search.searchLoading}
              error={search.searchError}
              results={search.searchResults}
              ownerProfiles={ownerProfiles}
              bookmarkedVideoIds={bookmarkedVideoIds}
              onClear={handleClearSearch}
              onRetry={() => search.performSearch(searchTerm)}
              onSelectVideo={selectSupabaseVideo}
              onSelectAlbum={albums.openAlbum}
              onToggleFavorite={toggleFavorite}
            />

            <CategoryVideosSection
              visible={!search.didSearch && !isLatestCategory && !isGuidebookCategory}
              categoryLabel={selectedCategory}
              videos={videos}
              loading={loading}
              error={error}
              bookmarkedVideoIds={bookmarkedVideoIds}
              onRefresh={handleRefreshVideos}
              onVideoSelect={openRandomVideoFullscreen}
              onToggleFavorite={toggleFavorite}
            />

            <LatestVideosSection
              visible={!search.didSearch && isLatestCategory}
              categoryLabel={selectedCategory}
              bookmarkedVideoIds={bookmarkedVideoIds}
              onVideoSelect={openRandomVideoFullscreen}
              onToggleFavorite={toggleFavorite}
            />

            <GuidebookSection
              visible={!search.didSearch && isGuidebookCategory}
              categoryLabel={selectedCategory}
              albums={albums.albums}
              loading={albums.albumsLoading}
              error={albums.albumsError}
              albumBookmarkedSet={albums.albumBookmarkedSet}
              onRefresh={handleRefreshAlbums}
              onOpenAlbum={albums.openAlbum}
              onToggleBookmark={albums.toggleAlbumBookmark}
            />
          </div>
        </div>
      )}

      {showReelsFromSearch && (
        <div className="fixed left-0 right-0 top-0 w-screen h-[var(--vvh)] translate-y-[var(--vvt)] z-50 bg-black [--footer-h:57px]">
          <ReelsScreen
            categorySlug={
              selectedCategory === "最新動画" || selectedCategory === "ガイドブック"
                ? undefined
                : resolveCategorySlug(selectedCategory)
            }
            startVideoId={selectedVideo?.id ?? null}
            onClose={() => setShowReelsFromSearch(false)}
          />
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
          ownerUserId={selectedVideo.owner_id}
          // liked={likedVideoIds.has(selectedVideo.id)}
          // likeCount={videoLikeCounts[selectedVideo.id] ?? 0}
          // onToggleLike={() => toggleVideoLike(selectedVideo.id)}
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
        open={Boolean(albums.openAlbumId)}
        assets={albums.albumAssets}
        index={albums.albumIndex}
        loading={albums.albumLoading}
        onClose={albums.closeAlbum}
        onIndexChange={(nextIndex) => {
          const clamped = Math.max(0, Math.min(nextIndex, albums.albumAssets.length - 1))
          albums.setAlbumIndex(clamped)
        }}
        title={albums.albums.find((a) => a.id === albums.openAlbumId)?.title || albums.albums.find((a) => a.id === albums.openAlbumId)?.description || null}
        ownerAvatarUrl={albums.albums.find((a) => a.id === albums.openAlbumId)?.owner?.avatarUrl ?? null}
        ownerLabel={(() => { const a = albums.albums.find((x) => x.id === albums.openAlbumId); const o = a?.owner; return o?.username ? `@${o.username}` : (o?.displayName || null) })()}
        ownerUserId={albums.albums.find((a) => a.id === albums.openAlbumId)?.owner?.id || null}
        description={albums.albums.find((a) => a.id === albums.openAlbumId)?.description || null}
        liked={albums.openAlbumId ? albums.albumLikedSet.has(albums.openAlbumId) : false}
        onToggleLike={() => { if (albums.openAlbumId) albums.toggleAlbumLike(albums.openAlbumId) } }
        bookmarked={albums.openAlbumId ? albums.albumBookmarkedSet.has(albums.openAlbumId) : false}
        onToggleBookmark={() => { if (albums.openAlbumId) albums.toggleAlbumBookmark(albums.openAlbumId) } } 
      />
      
      <Navigation />
   </div>
  )
}
