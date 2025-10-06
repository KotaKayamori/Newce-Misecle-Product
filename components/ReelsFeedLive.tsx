"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toggleLike } from "@/lib/likes"

type VideoRow = {
  id: string
  playback_url: string
  title: string | null
  caption: string | null
  created_at: string
  // Optional nested stats (when authenticated)
  video_likes?: { count?: number }[]
}

const PAGE = 50
const POLL_MS = 6000

export default function ReelsFeedLive() {
  const [items, setItems] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const idSetRef = useRef<Set<string>>(new Set())
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [optimisticDelta, setOptimisticDelta] = useState<Record<string, number>>({})
  const router = useRouter()
  const userIdRef = useRef<string | null>(null)

  // Cursors (tuple: created_at, id)
  const latest = useMemo(() => items[0], [items])
  const oldest = useMemo(() => (items.length ? items[items.length - 1] : undefined), [items])

  // Bottom sentinel for infinite scroll
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Observer to control single video playback
  const playObserverRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const activeIndexRef = useRef<number>(0)
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const attachVideoObservers = useCallback(() => {
    if (playObserverRef.current) playObserverRef.current.disconnect()
    const vids = containerRef.current?.querySelectorAll<HTMLVideoElement>("video[data-reel]") || []

    let playing: HTMLVideoElement | null = null
    const io = new IntersectionObserver(
      (entries) => {
        // Find the most visible entry over threshold
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          const target = visible[0].target as HTMLVideoElement
          if (playing && playing !== target) {
            try {
              playing.pause()
            } catch {}
          }
          try {
            target.play().catch(() => {})
          } catch {}
          playing = target
        } else {
          // If nothing meets threshold, pause current playing
          if (playing) {
            try {
              playing.pause()
            } catch {}
            playing = null
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 0.9], root: containerRef.current || undefined },
    )
    playObserverRef.current = io
    vids.forEach((v) => io.observe(v))
  }, [])

  const playOnlyIndex = useCallback((idx: number) => {
    const root = containerRef.current
    if (!root) return
    const vids = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-reel]'))
    vids.forEach((v, i) => {
      if (i === idx) {
        try {
          // ensure playback of the active one
          v.play().catch(() => {})
        } catch {}
      } else {
        try {
          v.pause()
        } catch {}
      }
    })
    activeIndexRef.current = Math.max(0, Math.min(idx, vids.length - 1))
  }, [])

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userIdRef.current = user?.id ?? null

      let q = supabase
        .from("videos")
        .select(
          user
            ? "id, playback_url, title, caption, created_at, video_likes(count)"
            : "id, playback_url, title, caption, created_at",
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE)

      const { data, error } = await q
      if (error) throw error
      const rows = (data as VideoRow[]) ?? []
      idSetRef.current = new Set(rows.map((r) => r.id))
      setItems(rows)
      setHasMore(rows.length === PAGE)

      // If logged in, fetch which of these are liked by me in one query
      if (user) {
        const ids = rows.map((r) => r.id)
        const { data: likedRows } = await supabase
          .from("video_likes")
          .select("video_id")
          .eq("user_id", user.id)
          .in("video_id", ids)
        const s = new Set<string>((likedRows ?? []).map((r: any) => r.video_id))
        setLikedSet(s)
      } else {
        setLikedSet(new Set())
      }
    } catch (e) {
      console.warn("reels initial load error", e)
      setItems([])
      setHasMore(false)
    } finally {
      setLoading(false)
      // Next tick attach observers
      setTimeout(attachVideoObservers, 0)
    }
  }, [attachVideoObservers])

  const fetchNewer = useCallback(async () => {
    if (!latest) return
    try {
      const iso = latest.created_at
      const id = latest.id
      const or = `and(created_at.gt.${iso}),and(created_at.eq.${iso},id.gt.${id})`
      const { data, error } = await supabase
        .from("videos")
        .select(
          userIdRef.current
            ? "id, playback_url, title, caption, created_at, video_likes(count)"
            : "id, playback_url, title, caption, created_at",
        )
        .or(or)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
      if (error) throw error
      const incoming = ((data as VideoRow[]) ?? []).filter((r) => !idSetRef.current.has(r.id))
      if (incoming.length) {
        incoming.forEach((r) => idSetRef.current.add(r.id))
        setItems((prev) => [...incoming.reverse(), ...prev])
        // update liked set for new items if logged
        if (userIdRef.current) {
          const ids = incoming.map((r) => r.id)
          const { data: likedRows } = await supabase
            .from("video_likes")
            .select("video_id")
            .eq("user_id", userIdRef.current)
            .in("video_id", ids)
          if (likedRows) {
            setLikedSet((prev) => {
              const s = new Set(prev)
              likedRows.forEach((r: any) => s.add(r.video_id))
              return s
            })
          }
        }
        setTimeout(attachVideoObservers, 0)
      }
    } catch (e) {
      console.warn("reels newer poll error", e)
    }
  }, [latest, attachVideoObservers])

  const fetchOlder = useCallback(async () => {
    if (!oldest || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const iso = oldest.created_at
      const id = oldest.id
      const or = `and(created_at.lt.${iso}),and(created_at.eq.${iso},id.lt.${id})`
      const { data, error } = await supabase
        .from("videos")
        .select(
          userIdRef.current
            ? "id, playback_url, title, caption, created_at, video_likes(count)"
            : "id, playback_url, title, caption, created_at",
        )
        .or(or)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE)
      if (error) throw error
      const rows = ((data as VideoRow[]) ?? []).filter((r) => !idSetRef.current.has(r.id))
      rows.forEach((r) => idSetRef.current.add(r.id))
      setItems((prev) => [...prev, ...rows])
      setHasMore(rows.length === PAGE)
      // liked set for older page: optional skip (only needed for visual consistency)
      if (userIdRef.current && rows.length) {
        const ids = rows.map((r) => r.id)
        const { data: likedRows } = await supabase
          .from("video_likes")
          .select("video_id")
          .eq("user_id", userIdRef.current)
          .in("video_id", ids)
        if (likedRows) {
          setLikedSet((prev) => {
            const s = new Set(prev)
            likedRows.forEach((r: any) => s.add(r.video_id))
            return s
          })
        }
      }
      setTimeout(attachVideoObservers, 0)
    } catch (e) {
      console.warn("reels older fetch error", e)
    } finally {
      setLoadingMore(false)
    }
  }, [oldest, loadingMore, hasMore, attachVideoObservers])

  const handleToggle = useCallback(
    async (id: string) => {
      // Need login?
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const currentlyLiked = likedSet.has(id)
      // optimistic
      setLikedSet((prev) => {
        const s = new Set(prev)
        if (currentlyLiked) s.delete(id)
        else s.add(id)
        return s
      })
      setOptimisticDelta((prev) => ({
        ...prev,
        [id]: (prev[id] ?? 0) + (currentlyLiked ? -1 : +1),
      }))

      try {
        const res = await toggleLike(id, currentlyLiked)
        if ((res as any).needLogin) router.push("/auth/login")
      } catch (e) {
        // rollback on error
        setLikedSet((prev) => {
          const s = new Set(prev)
          if (currentlyLiked) s.add(id)
          else s.delete(id)
          return s
        })
        setOptimisticDelta((prev) => ({
          ...prev,
          [id]: (prev[id] ?? 0) + (currentlyLiked ? +1 : -1),
        }))
      }
    },
    [likedSet, router],
  )

  // Infinite scroll observer
  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) fetchOlder()
        })
      },
      { rootMargin: "200px 0px 400px 0px", threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fetchOlder])

  // Initial load
  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  // Poll newer items
  useEffect(() => {
    const t = setInterval(() => {
      fetchNewer()
    }, POLL_MS)
    return () => clearInterval(t)
  }, [fetchNewer])

  // Re-attach video observers when list length changes (fallback)
  useEffect(() => {
    setTimeout(attachVideoObservers, 0)
    // enforce playback for first slide on initial load
    if (items.length > 0) setTimeout(() => playOnlyIndex(0), 0)
  }, [items.length, attachVideoObservers, playOnlyIndex])


  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-black text-white overflow-y-auto snap-y snap-mandatory overscroll-contain"
      onScroll={() => {
        // debounce and enforce active playback on rest
        if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current)
        scrollDebounceRef.current = setTimeout(() => {
          const el = containerRef.current
          if (!el) return
          const h = el.getBoundingClientRect().height || 1
          const idx = Math.round(el.scrollTop / h)
          if (idx !== activeIndexRef.current) playOnlyIndex(idx)
        }, 120)
      }}
    >
      {loading ? (
        <div className="h-screen flex items-center justify-center text-sm text-gray-300">Loading…</div>
      ) : items.length === 0 ? (
        <div className="h-screen flex items-center justify-center text-sm text-gray-300">まだ動画がありません</div>
      ) : (
        <>
          {items.map((v, idx) => (
            <div
              key={v.id}
              className="relative h-screen w-screen snap-start"
              style={{ scrollSnapStop: 'always' as any }}
            >
              <video
                data-reel
                src={v.playback_url}
                muted
                playsInline
                preload="metadata"
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* simple bottom overlay for title */}
              <div
                className="absolute inset-x-0 z-10 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between gap-3"
                style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium line-clamp-1">{v.title || ''}</p>
                  {v.caption && <p className="text-xs text-gray-300 line-clamp-2">{v.caption}</p>}
                </div>
                <button
                  onClick={() => handleToggle(v.id)}
                  className="shrink-0 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm"
                >
                  {likedSet.has(v.id) ? '❤️' : '🤍'}
                  <span className="ml-1 text-xs text-gray-200">
                    {(() => {
                      const base = (v as any)?.video_likes?.[0]?.count ?? 0
                      const delta = optimisticDelta[v.id] ?? 0
                      return base + delta
                    })()}
                  </span>
                </button>
              </div>
            </div>
          ))}
          {/* Sentinel for infinite scroll (kept off-screen; we also prefetch in step) */}
          <div ref={bottomRef} className="h-1" />
          {loadingMore && (
            <div className="h-16 flex items-center justify-center text-xs text-gray-400">Loading…</div>
          )}
        </>
      )}
    </div>
  )
}
