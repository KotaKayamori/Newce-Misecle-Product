"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type AlbumItem = {
  id: string
  title: string | null
  description: string | null
  coverUrl: string | null
  coverPath: string | null
  createdAt: string
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
  const [showMore, setShowMore] = useState(false)
  const [assetLoading, setAssetLoading] = useState(false)

  const fetchingRef = useRef(false)

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
        const items: AlbumItem[] = json?.items ?? []
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
      setShowMore(false)
      setOpenId(albumId)
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
    setShowMore(false)
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

  const currentAsset = assets[currentIndex]

  const activeAlbum = albums.find((album) => album.id === openId)

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => openAlbum(album.id)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">No Cover</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-black text-white shadow-xl">
            <button
              type="button"
              onClick={closeAlbum}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="閉じる"
            >
              ×
            </button>

            <div className="relative flex-1 bg-black">
              {assetLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-300">読み込み中...</div>
              ) : assets.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-300">
                  このアルバムには写真がありません。
                </div>
              ) : currentAsset ? (
                <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6">
                  <img
                    src={currentAsset.url}
                    alt={`asset-${currentAsset.id}`}
                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                  />
                  <div className="flex items-center justify-between gap-4 text-xs text-gray-300">
                    <span>
                      {currentIndex + 1} / {assets.length}
                    </span>
                    {(currentAsset.width || currentAsset.height) && (
                      <span>
                        {currentAsset.width ?? "?"} × {currentAsset.height ?? "?"} px
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {assets.length > 1 && !assetLoading && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-lg font-semibold hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="前へ"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-lg font-semibold hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="次へ"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {assets.length > 0 && (
              <div className="border-t border-white/10 bg-black/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">
                    {activeAlbum?.title || activeAlbum?.description || "アルバム"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMore((value) => !value)}
                    className="text-xs text-orange-300 underline-offset-2 hover:underline"
                  >
                    {showMore ? "閉じる" : "一覧を表示"}
                  </button>
                </div>

                {showMore && (
                  <div className="mt-3 flex max-h-40 gap-2 overflow-x-auto pb-1">
                    {assets.map((asset, index) => (
                      <button
                        key={asset.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded border ${
                          index === currentIndex ? "border-orange-400" : "border-white/20"
                        }`}
                        type="button"
                        aria-label={`写真 ${index + 1} を表示`}
                      >
                        <img src={asset.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
