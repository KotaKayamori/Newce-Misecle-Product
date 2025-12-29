"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { derivePosterUrl } from "@/app/search/utils"
import { ReservationModal } from "@/app/search/components/modals/ReservationModal"
import { StoreDetailModal } from "@/app/search/components/modals/StoreDetailModal"
import type { RestaurantInfo } from "@/app/search/types"
import { openReservationForVideo, openStoreDetailForVideo, normalizeOptionalText } from "@/lib/video-actions"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import { useBookmark } from "@/hooks/useBookmark"
import { useLike } from "@/hooks/useLike"
import { supabase } from "@/lib/supabase"
import { useVisualViewportVars } from "@/hooks/useVisualViewportVars"

type VideoRow = {
  id: string
  storage_path?: string | null
  title?: string | null
  caption?: string | null
  owner_id?: string | null
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

type OwnerProfile = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

const PAGE_SIZE = 15
const WINDOW = 2 // activeIndex ±2 を描画

type ReelsScreenProps = {
  categorySlug?: string
  startVideoId?: string | null
  onClose?: () => void
}

const moveStartIdToFront = (pool: string[], startVideoId?: string | null) => {
  if (!startVideoId) return pool
  const idx = pool.indexOf(startVideoId)
  if (idx <= 0) return pool
  const next = pool.slice()
  next.splice(idx, 1)
  next.unshift(startVideoId)
  return next
}

export default function ReelsScreen({ categorySlug, startVideoId, onClose }: ReelsScreenProps) {
  useVisualViewportVars()
  const [items, setItems] = useState<VideoRow[]>([])
  const [ownerProfiles, setOwnerProfiles] = useState<Record<string, OwnerProfile>>({})
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewportH, setViewportH] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 0)
  const [videoUrlMap, setVideoUrlMap] = useState<Record<string, string>>({})
  // 全動画のIDプール（初回にIDだけ取得してシャッフル）
  const [idPool, setIdPool] = useState<string[]>([])
  const [idCursor, setIdCursor] = useState(0)
  // リール滞在中は共通のミュート状態を使う（動画ごとではなくグローバル）
  const [muted, setMuted] = useState(true)

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
    if (typeof window === "undefined") return
    let rafId = 0
    const update = () => {
      rafId = 0
      const vv = window.visualViewport
      const height = vv?.height ?? window.innerHeight
      setViewportH(height)
    }
    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(update)
    }
    schedule()
    const vv = window.visualViewport
    vv?.addEventListener("resize", schedule)
    vv?.addEventListener("scroll", schedule)
    window.addEventListener("resize", schedule)
    window.addEventListener("orientationchange", schedule)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      vv?.removeEventListener("resize", schedule)
      vv?.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("orientationchange", schedule)
    }
  }, [])

  const fetchPage = useCallback(async () => {
    if (!hasMore) return
    try {
      let pool = idPool
      // IDプールが空なら全IDを取得してシャッフル
      if (pool.length === 0) {
        let idQuery = supabase.from("videos").select("id")
        if (categorySlug) {
          idQuery = idQuery.contains("categories", [categorySlug])
        }
        const { data: ids, error: idErr } = await idQuery
        if (idErr) throw idErr
        pool = ((ids as { id: string }[]) ?? []).map((r) => r.id)
        // シャッフル
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }
        pool = moveStartIdToFront(pool, startVideoId)
        setIdPool(pool)
        setIdCursor(0)
        setActiveIndex(0)
      }

      const start = idCursor
      const end = Math.min(idCursor + PAGE_SIZE, pool.length)
      const slice = pool.slice(start, end)
      if (slice.length === 0) {
        setHasMore(false)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, storage_path, title, caption, owner_id, created_at, video_likes(count), store_1_name, store_1_tel, store_1_tabelog, store_2_name, store_2_tel, store_2_tabelog, store_3_name, store_3_tel, store_3_tabelog",
        )
        .in("id", slice)

      if (error) throw error
      const rows = (data as VideoRow[]) ?? []
      // slice の順序で並べ替え（in句は順不同）
      rows.sort((a, b) => slice.indexOf(a.id) - slice.indexOf(b.id))
      setItems((prev) => [...prev, ...rows])
      setIdCursor(end)
      setHasMore(end < pool.length)

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
  }, [hasMore, idCursor, idPool])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // 個別に playback_url を取得して map に保持
  const ensureVideoUrl = useCallback(
    async (id: string) => {
      if (videoUrlMap[id]) return videoUrlMap[id]
      const { data, error } = await supabase.from("videos").select("playback_url").eq("id", id).single()
      if (!error && data?.playback_url) {
        setVideoUrlMap((prev) => ({ ...prev, [id]: data.playback_url }))
        return data.playback_url
      }
      return undefined
    },
    [videoUrlMap],
  )

  // active 変更時に必要なら playback_url を取得
  useEffect(() => {
    const current = items[activeIndex]
    if (current) ensureVideoUrl(current.id)
  }, [activeIndex, items, ensureVideoUrl])

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
    return (
      <div className="fixed left-0 right-0 top-0 w-screen h-[var(--vvh)] translate-y-[var(--vvt)] flex items-center justify-center text-sm text-gray-300 bg-black">
        Loading…
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="fixed left-0 right-0 top-0 w-screen h-[var(--vvh)] translate-y-[var(--vvt)] flex items-center justify-center text-sm text-gray-300 bg-black">
        まだ動画がありません
      </div>
    )
  }

  return (
    <>
      <div
        ref={listRef}
        className="fixed left-0 right-0 top-0 w-screen h-[var(--vvh)] translate-y-[var(--vvt)] bg-black text-white overflow-y-auto snap-y snap-mandatory overscroll-contain [--footer-h:57px]"
      >
        <div style={{ height: topSpacer }} />
        {items.slice(renderRange.start, renderRange.end + 1).map((post, idx) => {
          const globalIndex = renderRange.start + idx
          return (
            <ReelItem
              key={post.id}
              post={post}
              index={globalIndex}
              active={globalIndex === activeIndex}
              videoUrl={videoUrlMap[post.id]}
              bookmarked={bookmarkedVideoIds.has(post.id)}
              onToggleBookmark={() => toggleBookmark(post.id)}
              muted={muted}
              onToggleMuted={() => setMuted((m) => !m)}
              ownerProfile={post.owner_id ? ownerProfiles[post.owner_id] : undefined}
              registerObserver={registerActiveTarget}
              onCloseReel={() => (onClose ? onClose() : window.history.back())}
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
      </div>

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
    </>
  )
}

function ReelItem({
  post,
  index,
  active,
  videoUrl,
  bookmarked,
  onToggleBookmark,
  muted,
  onToggleMuted,
  ownerProfile,
  registerObserver,
  onCloseReel,
  onOpenReserve,
  onOpenStore,
}: {
  post: VideoRow
  index: number
  active: boolean
  videoUrl?: string
  bookmarked: boolean
  onToggleBookmark: () => void
  muted: boolean
  onToggleMuted: () => void
  ownerProfile?: OwnerProfile
  registerObserver: (el: HTMLElement, index: number) => void
  onCloseReel: () => void
  onOpenReserve: () => void
  onOpenStore: () => void
}) {
  const { isLiked, likeCount, toggleLike } = useLike(post.id, post.video_likes?.[0]?.count ?? 0)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const ownerHandle = useMemo(() => {
    if (ownerProfile?.username) return `@${ownerProfile.username}`
    if (ownerProfile?.display_name) return ownerProfile.display_name
    return post.owner_id ? `@${post.owner_id.slice(0, 8)}` : "@user"
  }, [ownerProfile, post.owner_id])
  const ownerAvatarUrl = ownerProfile?.avatar_url ?? null
  const posterUrl = useMemo(
    () => derivePosterUrl(videoUrl, post.storage_path) || undefined,
    [videoUrl, post.storage_path],
  )

  useEffect(() => {
    if (wrapperRef.current) registerObserver(wrapperRef.current, index)
  }, [registerObserver, index])

  return (
    <div
      ref={wrapperRef}
      className="relative h-[var(--vvh)] w-screen snap-start"
      style={{ scrollSnapStop: "always" as any }}
    >
      <VideoFullscreenOverlay
        open={active}
        variant="reels"
        video={{
          id: post.id,
          playback_url: active ? videoUrl || "" : "",
          poster_url: posterUrl,
          title: post.title ?? undefined,
          caption: normalizeOptionalText(post.caption) ?? undefined,
        }}
        ownerHandle={ownerHandle}
        ownerAvatarUrl={ownerAvatarUrl}
        liked={isLiked}
        likeCount={likeCount}
        onToggleLike={toggleLike}
        bookmarked={bookmarked}
        onToggleBookmark={onToggleBookmark}
        onShare={async () => {
          try {
            const url = videoUrl || ""
            const shareData = { title: post.title || "動画", url }
            if (navigator.share) await navigator.share(shareData)
            else {
              await navigator.clipboard.writeText(shareData.url)
              alert("リンクをコピーしました")
            }
          } catch {}
        }}
        onClose={onCloseReel}
        onReserve={onOpenReserve}
        onMore={onOpenStore}
        muted={muted}
        onToggleMuted={onToggleMuted}
      />
    </div>
  )
}
