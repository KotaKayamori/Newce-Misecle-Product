"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { derivePosterUrl } from "@/app/search/utils"
import { ReservationModal } from "@/app/search/components/modals/ReservationModal"
import { StoreDetailModal } from "@/app/search/components/modals/StoreDetailModal"
import type { RestaurantInfo } from "@/app/search/types"
import { openReservationForVideo, openStoreDetailForVideo, normalizeOptionalText } from "@/lib/video-actions"
import FullscreenMediaPlayer from "@/components/player/FullscreenMediaPlayer"
import { useBookmark } from "@/hooks/useBookmark"
import { useLike } from "@/hooks/useLike"
import { supabase } from "@/lib/supabase"

type VideoRow = {
  id: string
  playback_url: string
  storage_path?: string | null
  title?: string | null
  caption?: string | null
  owner_id?: string | null
  created_at: string
  video_likes?: { count?: number }[]
  store_1_name?: string | null
  store_1_tel?: string | null
  store_2_name?: string | null
  store_2_tel?: string | null
  store_3_name?: string | null
  store_3_tel?: string | null
}

type OwnerProfile = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

const PAGE_SIZE = 15
const WINDOW = 2 // activeIndex ±2 を描画

export default function ReelsScreen() {
  const [items, setItems] = useState<VideoRow[]>([])
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, OwnerProfile>>({})
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewportH, setViewportH] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 0)

  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()
  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const activeObserverRef = useRef<IntersectionObserver | null>(null)

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

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener("resize", onResize)
    onResize()
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const fetchPage = useCallback(async () => {
    if (!hasMore) return
    try {
      const query = supabase
        .from("videos")
        .select(
          "id, playback_url, storage_path, title, caption, owner_id, created_at, video_likes(count), store_1_name, store_1_tel, store_2_name, store_2_tel, store_3_name, store_3_tel",
        )
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (cursor) query.lt("created_at", cursor)

      const { data, error } = await query
      if (error) throw error
      const rows = (data as VideoRow[]) ?? []
      setItems((prev) => [...prev, ...rows])
      setCursor(rows.length ? rows[rows.length - 1].created_at : cursor)
      setHasMore(rows.length === PAGE_SIZE)

      const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[]
      if (ownerIds.length) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ownerIds)
        if (profiles) {
          setOwnerProfiles((prev) => {
            const next = { ...prev }
            ;(profiles as any[]).forEach((p) => {
              next[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }
            })
            return next
          })
        }
      }
    } catch (e) {
      console.warn("reels fetch error", e)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // Sentinel for pagination
  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = listRef.current
    if (!sentinel || !root) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) fetchPage()
        })
      },
      { root, rootMargin: "400px 0px 800px 0px", threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [fetchPage, items.length])

  // Active observer (唯一のactive決定)
  const registerActiveTarget = useCallback(
    (el: HTMLElement, index: number) => {
      const root = listRef.current
      if (!root) return
      if (!activeObserverRef.current) {
        activeObserverRef.current = new IntersectionObserver(
          (entries) => {
            const best = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0]
            if (best) setActiveIndex(Number(best.target.getAttribute("data-index")))
          },
          { root, threshold: [0.25, 0.6, 0.9] },
        )
      }
      el.setAttribute("data-index", String(index))
      activeObserverRef.current.observe(el)
    },
    [],
  )

  const renderRange = useMemo(() => {
    const start = Math.max(0, activeIndex - WINDOW)
    const end = Math.min(items.length - 1, activeIndex + WINDOW)
    return { start, end }
  }, [activeIndex, items.length])

  const topSpacer = Math.max(0, renderRange.start * viewportH)
  const bottomSpacer = Math.max(0, (items.length - renderRange.end - 1) * viewportH)

  if (loading && items.length === 0) {
    return <div className="h-screen w-screen flex items-center justify-center text-sm text-gray-300 bg-black">Loading…</div>
  }

  if (!items.length) {
    return <div className="h-screen w-screen flex items-center justify-center text-sm text-gray-300 bg-black">まだ動画がありません</div>
  }

  return (
    <div ref={listRef} className="h-screen w-screen bg-black text-white overflow-y-auto snap-y snap-mandatory overscroll-contain">
      <div style={{ height: topSpacer }} />
      {items.slice(renderRange.start, renderRange.end + 1).map((post, idx) => {
        const globalIndex = renderRange.start + idx
        return (
          <ReelItem
            key={post.id}
            post={post}
            index={globalIndex}
            active={globalIndex === activeIndex}
            bookmarked={bookmarkedVideoIds.has(post.id)}
            onToggleBookmark={() => toggleBookmark(post.id)}
            ownerProfile={post.owner_id ? ownerProfiles[post.owner_id] : undefined}
            registerObserver={registerActiveTarget}
            onOpenReserve={() =>
              openReservationForVideo({ setSelectedRestaurant, setShowReservationModal }, post, { keepFullscreen: true })
            }
            onOpenStore={() => {
              const ownerProfile = post.owner_id ? ownerProfiles[post.owner_id] : undefined
              const enriched = {
                ...post,
                owner_label: ownerProfile?.username ? `@${ownerProfile.username}` : ownerProfile?.display_name ?? null,
                owner_avatar_url: ownerProfile?.avatar_url ?? null,
              }
              openStoreDetailForVideo({ setSelectedRestaurant, setShowStoreDetailModal }, enriched as any, {
                keepFullscreen: true,
              })
            }}
          />
        )
      })}
      <div style={{ height: bottomSpacer }} />
      <div ref={sentinelRef} className="h-1" />

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
      <StoreDetailModal
        open={showStoreDetailModal}
        onClose={() => setShowStoreDetailModal(false)}
        restaurant={selectedRestaurant}
        onReserve={() => {
          setShowStoreDetailModal(false)
          setShowReservationModal(true)
        }}
      />
    </div>
  )
}

function ReelItem({
  post,
  index,
  active,
  bookmarked,
  onToggleBookmark,
  ownerProfile,
  registerObserver,
  onOpenReserve,
  onOpenStore,
}: {
  post: VideoRow
  index: number
  active: boolean
  bookmarked: boolean
  onToggleBookmark: () => void
  ownerProfile?: OwnerProfile
  registerObserver: (el: HTMLElement, index: number) => void
  onOpenReserve: () => void
  onOpenStore: () => void
}) {
  const { isLiked, likeCount, toggleLike } = useLike(post.id, post.video_likes?.[0]?.count ?? 0)
  const [muted, setMuted] = useState(true)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const ownerHandle = useMemo(() => {
    if (ownerProfile?.username) return `@${ownerProfile.username}`
    if (ownerProfile?.display_name) return ownerProfile.display_name
    return post.owner_id ? `@${post.owner_id.slice(0, 8)}` : "@user"
  }, [ownerProfile, post.owner_id])
  const ownerAvatarUrl = ownerProfile?.avatar_url ?? null
  const posterUrl = useMemo(
    () => derivePosterUrl(post.playback_url, post.storage_path) || undefined,
    [post.playback_url, post.storage_path],
  )

  useEffect(() => {
    if (wrapperRef.current) registerObserver(wrapperRef.current, index)
  }, [registerObserver, index])

  return (
    <div
      ref={wrapperRef}
      className="relative h-screen w-screen snap-start"
      style={{ scrollSnapStop: "always" as any }}
    >
      <FullscreenMediaPlayer
        open
        active={active}
        post={{
          id: post.id,
          videoUrl: active ? post.playback_url : "", // 非activeはsrcなし
          posterUrl,
          title: post.title || post.caption || "動画",
          caption: normalizeOptionalText(post.caption) || undefined,
        }}
        ownerHandle={ownerHandle}
        ownerAvatarUrl={ownerAvatarUrl}
        liked={isLiked}
        likeCount={likeCount}
        bookmarked={bookmarked}
        onToggleLike={toggleLike}
        onToggleBookmark={onToggleBookmark}
        onShare={async () => {
          try {
            const shareData = { title: post.title || "動画", url: post.playback_url }
            if (navigator.share) await navigator.share(shareData)
            else {
              await navigator.clipboard.writeText(shareData.url)
              alert("リンクをコピーしました")
            }
          } catch {}
        }}
        onReserve={onOpenReserve}
        onMore={onOpenStore}
        muted={muted}
        onToggleMuted={() => setMuted((m) => !m)}
      />
    </div>
  )
}
