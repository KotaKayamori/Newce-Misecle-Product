"use client"

import React, { useMemo, useState } from "react"
import { Heart, Bookmark, Send } from "lucide-react"
import { ImageCarousel } from "./ImageCarousel"

export type AlbumAsset = { id: string; url: string; order: number; width?: number | null; height?: number | null }

interface AlbumViewerOverlayProps {
  open: boolean
  assets: AlbumAsset[]
  index: number
  loading?: boolean
  onClose: () => void
  onIndexChange: (nextIndex: number) => void
  // Optional meta
  title?: string | null
  ownerAvatarUrl?: string | null
  ownerLabel?: string | null
  onMore?: () => void
  description?: string | null
  liked?: boolean
  likeCount?: number
  onToggleLike?: () => void
  bookmarked?: boolean
  onToggleBookmark?: () => void
  onShare?: () => void
}

export default function AlbumViewerOverlay(props: AlbumViewerOverlayProps) {
  const {
    open,
    assets,
    index,
    loading = false,
    onClose,
    onIndexChange,
    title,
    ownerAvatarUrl,
    ownerLabel,
    onMore,
    description,
    liked,
    likeCount,
    onToggleLike,
    bookmarked,
    onToggleBookmark,
    onShare,
  } = props
  if (!open) return null

  const hasAssets = assets && assets.length > 0
  const [detailOpen, setDetailOpen] = useState(false)
  const [likedInternal, setLikedInternal] = useState(Boolean(liked))
  const [likeCountInternal, setLikeCountInternal] = useState<number>(likeCount ?? 0)
  const [bookmarkedInternal, setBookmarkedInternal] = useState(Boolean(bookmarked))
  const currentUrl = useMemo(() => assets?.[index]?.url || "", [assets, index])
  const totalAssets = assets?.length ?? 0
  const canPrev = index > 0
  const canNext = index < totalAssets - 1

  const handlePrev = () => {
    if (!canPrev) return
    onIndexChange(index - 1)
  }

  const handleNext = () => {
    if (!canNext) return
    onIndexChange(index + 1)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onClose}
        className="absolute left-6 top-6 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="閉じる"
      >
        ＜
      </button>

      {loading ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-white/70">読み込み中...</div>
      ) : !hasAssets ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-white/70">このアルバムには写真がありません。</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pb-32 pt-12">
          <div className="relative flex items-center justify-center">
            <ImageCarousel
              images={assets.map((asset) => asset.url)}
              currentIndex={index}
              onIndexChange={onIndexChange}
              showControls={false}
              fit="contain"
              className="w-screen max-w-[100vw] max-h-[85vh]"
              imageClassName="max-h-[85vh]"
            />
            <span className="absolute right-0 top-0 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white">
              {index + 1} / {assets.length}
            </span>
            {assets.length > 1 && (
              <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canPrev}
                  aria-label="前へ"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                >
                  ‹
                </button>
                <div className="flex items-center justify-center gap-2">
                  {assets.map((_, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  aria-label="次へ"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
          {/* Meta overlay (icon + title) - place next to back button to avoid overlap */}
          <div className="absolute top-6 left-16 z-50 flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
              {ownerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ownerAvatarUrl} alt={ownerLabel ?? "user"} className="w-full h-full object-cover" />
              ) : (
                (ownerLabel?.replace(/^@/, "").charAt(0).toUpperCase() || "U")
              )}
            </div>
            <div className="flex flex-col">
              {ownerLabel && <span className="text-white font-semibold text-sm leading-none">{ownerLabel}</span>}
              {title && <span className="text-white/90 text-xs leading-tight line-clamp-1 max-w-[60vw]">{title}</span>}
            </div>
          </div>
        </div>
      )}
      {/* Page indicator moved under image (inside relative container) */}
      {/* Bottom single CTA: もっと見る… */}
      <div className="absolute bottom-16 left-0 right-0 px-4">
        <div className="flex">
          <button
            type="button"
            onClick={() => {
              if (onMore) onMore()
              else setDetailOpen(true)
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
          >
            もっと見る…
          </button>
        </div>
      </div>
      {detailOpen && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setDetailOpen(false)} className="text-lg">＜</button>
              <h2 className="text-lg font-semibold">アルバム詳細</h2>
              <div className="w-8"></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
                  {ownerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ownerAvatarUrl} alt={ownerLabel ?? "user"} className="w-full h-full object-cover" />
                  ) : (
                    (ownerLabel?.replace(/^@/, "").charAt(0).toUpperCase() || "U")
                  )}
                </div>
                <div className="flex-1">
                  {ownerLabel && <p className="text-sm font-semibold">{ownerLabel}</p>}
                  {title && <p className="text-xs text-gray-600">{title}</p>}
                </div>
              </div>
              {description && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{description}</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Right side actions */}
      <div className="absolute right-4 top-0 bottom-0 z-50 w-16 flex flex-col items-center justify-center pb-32 gap-6">
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center"
            aria-label={(liked ?? likedInternal) ? "いいね解除" : "いいね"}
            onClick={() => {
              if (onToggleLike) onToggleLike()
              else {
                const next = !(liked ?? likedInternal)
                setLikedInternal(next)
                setLikeCountInternal((c) => Math.max(0, c + (next ? 1 : -1)))
              }
            }}
          >
            <Heart
              className={`w-8 h-8 ${(liked ?? likedInternal) ? "fill-red-500 text-transparent" : "text-white"}`}
              // eslint-disable-next-line react/no-unknown-property
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
            />
          </button>
          <span
            className="text-white text-xs font-medium mt-1"
            // eslint-disable-next-line react/no-unknown-property
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
          >
            {likeCount ?? likeCountInternal}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center"
            aria-label={(bookmarked ?? bookmarkedInternal) ? "ブックマーク解除" : "ブックマーク"}
            onClick={() => {
              if (onToggleBookmark) onToggleBookmark()
              else setBookmarkedInternal((b) => !b)
            }}
          >
            <Bookmark
              className={`w-8 h-8 ${(bookmarked ?? bookmarkedInternal) ? "fill-orange-500 text-orange-500" : "text-white"}`}
              // eslint-disable-next-line react/no-unknown-property
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
            />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center"
            aria-label="共有"
            onClick={async () => {
              try {
                if (onShare) return void onShare()
                const url = currentUrl
                if ((navigator as any).share) await (navigator as any).share({ url })
                else { await navigator.clipboard.writeText(url); alert("リンクをコピーしました") }
              } catch {}
            }}
          >
            <Send
              className="w-8 h-8 text-white"
              // eslint-disable-next-line react/no-unknown-property
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
