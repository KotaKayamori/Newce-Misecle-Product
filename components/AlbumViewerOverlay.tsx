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
    <div className="fixed inset-0 z-50 bg-white">
      {/* 上部固定バー：閉じる + owner アイコン + ownerLabel/title */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/95 border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black hover:bg-black/5 focus:outline-none"
            aria-label="閉じる"
          >
            ＜
          </button>

          {/* owner アイコン + テキスト */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden border border-gray-300">
              {ownerAvatarUrl ? (
                <img src={ownerAvatarUrl} alt={ownerLabel ?? "user"} className="w-full h-full object-cover" />
              ) : (
                (ownerLabel?.replace(/^@/, "").charAt(0).toUpperCase() || "U")
              )}
            </div>
            <div className="flex flex-col min-w-0">
              {ownerLabel && (
                <span className="text-black font-semibold text-sm leading-none truncate">
                  {ownerLabel}
                </span>
              )}
              {title && (
                <span className="text-black/90 text-xs leading-tight truncate">
                  {title}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-black/70">読み込み中...</div>
      ) : !hasAssets ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-black/70">このアルバムには写真がありません。</div>
      ) : (
        <div className="flex flex-col h-full pt-12 pb-8 overflow-y-auto">
          <div className="flex-1 flex items-center justify-center mt-4">
            <div className="relative flex items-center justify-center">
              <ImageCarousel
                images={assets.map((asset) => asset.url)}
                currentIndex={index}
                onIndexChange={onIndexChange}
                // showControls={false}
                className="w-screen max-w-[100vw] max-h-[85vh]"
                imageClassName="max-h-[85vh]"
                fit="contain"
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
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/50 text-black hover:bg-white/70 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <div className="flex items-center justify-center gap-2">
                    {assets.map((_, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-black" : "bg-black/40"}`} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canNext}
                    aria-label="次へ"
                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/50 text-black hover:bg-white/70 disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom actions: いいね / 保存 / 共有（横並び・黒ボタン） */}
          <div className="mt-4">
            <div className="flex justify-start">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center"
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
                    className={`w-6 h-6 ${(liked ?? likedInternal) ? "fill-red-500 text-transparent" : "text-black"}`}
                  />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center"
                  aria-label={(bookmarked ?? bookmarkedInternal) ? "ブックマーク解除" : "ブックマーク"}
                  onClick={() => {
                    if (onToggleBookmark) onToggleBookmark()
                    else setBookmarkedInternal((b) => !b)
                  }}
                >
                  <Bookmark
                    className={`w-6 h-6 ${(bookmarked ?? bookmarkedInternal) ? "fill-orange-500 text-orange-500" : "text-black"}`}
                  />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center"
                  aria-label="共有"
                  onClick={async () => {
                    try {
                      if (onShare) return void onShare()
                      const url = currentUrl
                      if ((navigator as any).share) await (navigator as any).share({ url })
                      else {
                        await navigator.clipboard.writeText(url);
                        alert("リンクをコピーしました");
                      }
                    } catch {}
                  }}
                >
                  <Send
                    className="w-6 h-6 text-black"
                  />
                </button>
              </div>
            </div>

            {/* description をそのまま表示（あれば） */}
            {description && (
              <div className="mt-3 px-4 pb-10 text-sm text-gray-800 whitespace-pre-wrap">
                {description}
              </div>
            )}
          </div>
        </div>
      )}      
    </div>
  )
}
