"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  TouchEvent as ReactTouchEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react"

type AlbumItem = {
  id: string
  title: string | null
  description: string | null
  coverUrl: string | null
  coverPath: string | null
  createdAt: string
  ownerId: string | null
  owner?: {
    id: string | null
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
  } | null
}

type AssetItem = {
  id: string
  url: string
  order: number
  width?: number | null
  height?: number | null
}

export default function GuidebookTab() {
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [offset, setOffset] = useState<number | null>(0)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [assetLoading, setAssetLoading] = useState(false)
  const [showCaption, setShowCaption] = useState(false)

  const fetchingRef = useRef(false)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipeHandledRef = useRef(false)
  const pointerActiveRef = useRef(false)
  const wheelResetTimerRef = useRef<number | null>(null)

  const fetchAlbums = useCallback(
    async (nextOffset: number | null = 0, options?: { force?: boolean }) => {
      if (nextOffset === null) return
      if (fetchingRef.current && !options?.force) return
      fetchingRef.current = true
      setLoading(true)
      try {
        const res = await fetch(`/api/guidebook/albums?limit=24&offset=${nextOffset}`, { cache: "no-store" })
        if (!res.ok) throw new Error("failed")
        const json = await res.json()
        const items: AlbumItem[] = (json?.items ?? []).map((item: any) => {
          const owner = item?.owner || null
          return {
            ...item,
            ownerId: item?.ownerId ?? item?.owner_id ?? null,
            owner: owner
              ? {
                  id: owner.id ?? null,
                  username: owner.username ?? null,
                  displayName: owner.display_name ?? null,
                  avatarUrl: owner.avatar_url ?? null,
                }
              : null,
          }
        })
        setAlbums((prev) => (nextOffset === 0 ? items : [...prev, ...items]))
        setOffset(json?.nextOffset ?? null)
      } catch (error) {
        console.error("guidebook fetchAlbums error:", error)
      } finally {
        fetchingRef.current = false
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchAlbums(0)
  }, [fetchAlbums])

  useEffect(() => {
    const handleScroll = () => {
      if (offset === null || fetchingRef.current) return
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) fetchAlbums(offset)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [fetchAlbums, offset])

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
    const channel = new BroadcastChannel("guidebook-updates")
    channel.onmessage = (event) => {
      if (event?.data?.type === "album-uploaded") {
        setOffset(0)
        fetchAlbums(0, { force: true })
      }
    }
    return () => channel.close()
  }, [fetchAlbums])

  const openAlbum = useCallback(async (albumId: string) => {
    setAssetLoading(true)
    try {
      const res = await fetch(`/api/guidebook/albums/${albumId}/assets`, { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const json = await res.json()
      const items: AssetItem[] = json?.items ?? []
      setAssets(items)
      setCurrentIndex(0)
      setOpenId(albumId)
      setShowCaption(false)
    } catch (error) {
      console.error("guidebook openAlbum error:", error)
      setAssets([])
      setOpenId(albumId)
    } finally {
      setAssetLoading(false)
    }
  }, [])

  const closeAlbum = useCallback(() => {
    setOpenId(null)
    setAssets([])
    setCurrentIndex(0)
    setShowCaption(false)
  }, [])

  useEffect(() => {
    if (!openId) return
    const prev = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAlbum()
      else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(i + 1, Math.max(assets.length - 1, 0)))
      else if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.paddingRight = prev.paddingRight
      window.removeEventListener("keydown", onKey)
    }
  }, [openId, assets.length, closeAlbum])

  const next = () => setCurrentIndex((i) => Math.min(i + 1, Math.max(assets.length - 1, 0)))
  const prev = () => setCurrentIndex((i) => Math.max(i - 1, 0))

  const clearWheelResetTimer = () => {
    if (wheelResetTimerRef.current !== null) {
      window.clearTimeout(wheelResetTimerRef.current)
      wheelResetTimerRef.current = null
    }
  }

  const resetSwipe = () => {
    swipeStartRef.current = null
    swipeHandledRef.current = false
    pointerActiveRef.current = false
    clearWheelResetTimer()
  }

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (pointerActiveRef.current) return
    const touch = event.touches[0]
    if (!touch) return
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    swipeHandledRef.current = false
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (pointerActiveRef.current) return
    const start = swipeStartRef.current
    if (!start || swipeHandledRef.current) return
    const touch = event.touches[0]
    if (!touch) return
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) prev()
      else next()
      swipeHandledRef.current = true
    }
  }

  const handleTouchEnd = () => {
    resetSwipe()
  }

  const handleTouchCancel = () => {
    resetSwipe()
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.buttons !== 1) return
    pointerActiveRef.current = true
    swipeStartRef.current = { x: event.clientX, y: event.clientY }
    swipeHandledRef.current = false
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return
    const start = swipeStartRef.current
    if (!start || swipeHandledRef.current) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) prev()
      else next()
      swipeHandledRef.current = true
    }
  }

  const handlePointerUp = () => {
    resetSwipe()
  }

  const handlePointerCancel = () => {
    resetSwipe()
  }

  const handlePointerLeave = () => {
    resetSwipe()
  }

  const scheduleWheelReset = () => {
    clearWheelResetTimer()
    wheelResetTimerRef.current = window.setTimeout(() => {
      swipeHandledRef.current = false
      wheelResetTimerRef.current = null
    }, 220)
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) < 10 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
    if (swipeHandledRef.current) {
      scheduleWheelReset()
      return
    }
    if (event.deltaX > 0) next()
    else prev()
    swipeHandledRef.current = true
    scheduleWheelReset()
  }

  const currentAsset = assets[currentIndex]

  const activeAlbum = albums.find((album) => album.id === openId)
  const activeOwner = activeAlbum?.owner || null
  const activeOwnerHandle = activeOwner?.username
    ? `@${activeOwner.username}`
    : activeOwner?.displayName || (activeOwner?.id ? "ユーザー" : "")

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => openAlbum(album.id)}
            className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">No Cover</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
              <div className="line-clamp-1 text-xs text-white">
                {album.title || album.description || "アルバム"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-6 text-sm text-gray-500">読み込み中...</div>}

      {!loading && albums.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
          表示できるアルバムがありません。
        </div>
      )}

      {openId && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            type="button"
            onClick={closeAlbum}
            className="absolute left-6 top-6 z-[70] inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="閉じる"
          >
            ＜
          </button>

          {activeOwnerHandle && (
            <div className="absolute left-6 bottom-[9rem] flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold">
                {activeOwner?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeOwner.avatarUrl} alt={activeOwnerHandle} className="h-full w-full object-cover" />
                ) : (
                  activeOwnerHandle.replace(/^@/, "").charAt(0).toUpperCase() || "U"
                )}
              </div>
              <p className="text-sm font-semibold">{activeOwnerHandle}</p>
            </div>
          )}

          <div className="absolute left-6 bottom-[7.5rem] max-w-[70vw] pr-12 text-left text-white">
            <p className="text-sm font-semibold leading-tight">
              {activeAlbum?.title || activeAlbum?.description || "アルバム"}
            </p>
          </div>

          {assetLoading ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/70">読み込み中...</div>
          ) : assets.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
              このアルバムには写真がありません。
            </div>
          ) : currentAsset ? (
            <>
              <div
                className="absolute inset-0 flex items-center justify-center pb-32 pt-12"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerLeave}
                onWheel={handleWheel}
              >
                <div className="relative">
                  <img
                    src={currentAsset.url}
                    alt={`asset-${currentAsset.id}`}
                    className="max-h-[85vh] w-auto max-w-[90vw] object-contain"
                  />
                  <span className="absolute right-0 top-0 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    {currentIndex + 1} / {assets.length}
                  </span>
                  {assets.length > 1 && (
                    <div className="absolute left-1/2 top-full mt-6 -translate-x-1/2 flex items-center gap-2">
                      {assets.map((asset, index) => (
                        <span
                          key={asset.id}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            index === currentIndex ? "bg-white" : "bg-white/40"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {assets.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-lg font-semibold text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="前へ"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-lg font-semibold text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="次へ"
                  >
                    ›
                  </button>
                </>
              )}

            <div className="absolute bottom-16 left-0 right-0 px-6">
                <button
                  type="button"
                  onClick={() => setShowCaption(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                >
                  もっと見る
                </button>
              </div>

              {showCaption && (
                <div
                  className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 pb-10 pt-16 sm:items-center"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) setShowCaption(false)
                  }}
                >
                  <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setShowCaption(false)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-100"
                        aria-label="閉じる"
                      >
                        ＜
                      </button>
                      <h2 className="text-sm font-semibold text-gray-900">詳細情報</h2>
                      <span className="w-10" aria-hidden />
                    </div>
                    <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6 scrollbar-hide">
                      {activeAlbum?.title && (
                        <h3 className="text-base font-semibold text-gray-900">{activeAlbum.title}</h3>
                      )}
                      {activeOwnerHandle && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                            {activeOwner?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={activeOwner.avatarUrl} alt={activeOwnerHandle} className="h-full w-full object-cover" />
                            ) : (
                              activeOwnerHandle.replace(/^@/, "").charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{activeOwnerHandle}</span>
                            {activeOwner?.displayName && (
                              <span className="text-xs text-gray-500">{activeOwner.displayName}</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="rounded-2xl bg-gray-50 p-5">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                          {activeAlbum?.description?.trim() || "詳細情報がまだ追加されていません"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
