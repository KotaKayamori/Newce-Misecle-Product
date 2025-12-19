"use client"

import { useEffect, useRef } from "react"
import MediaActions from "@/components/media/MediaActions"
import { Button } from "@/components/ui/button"

export interface FullscreenMediaPlayerProps {
  /** 表示するかどうか（親で条件分岐しない場合は true を渡す） */
  open?: boolean
  /** このプレイヤーがアクティブ（画面内）かどうか。true のときだけ自動再生し、false で一時停止 */
  active: boolean
  post: {
    id: string
    videoUrl: string
    posterUrl?: string | null
    title?: string | null
    caption?: string | null
  }
  ownerHandle: string
  ownerAvatarUrl?: string | null
  liked: boolean
  likeCount?: number
  bookmarked: boolean
  onToggleLike: () => void
  onToggleBookmark: () => void
  onShare: () => Promise<void> | void
  onClose?: () => void
  onReserve?: () => void
  onMore?: () => void
  muted: boolean
  onToggleMuted: () => void
}

export default function FullscreenMediaPlayer(props: FullscreenMediaPlayerProps) {
  const {
    open = true,
    active,
    post,
    ownerHandle,
    ownerAvatarUrl,
    liked,
    likeCount = 0,
    bookmarked,
    onToggleLike,
    onToggleBookmark,
    onShare,
    onClose,
    onReserve,
    onMore,
    muted,
    onToggleMuted,
  } = props

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (active && post.videoUrl) {
      // attach src only when active
      if (!el.getAttribute("src")) {
        el.setAttribute("src", post.videoUrl)
        el.load()
      }
      try {
        el.play().catch(() => {})
      } catch {}
    } else {
      try {
        el.pause()
      } catch {}
      // detach src to release network/decoder
      el.removeAttribute("src")
      el.load()
    }
  }, [active, post.videoUrl])

  if (!open) return null

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={post.videoUrl}
        className="w-full h-full object-cover"
        poster={post.posterUrl || "/placeholder.jpg"}
        muted={muted}
        loop
        autoPlay={active}
        playsInline
        {...{ "webkit-playsinline": "true" }}
        preload="auto"
        controls={false}
      />

      {/* Back button */}
      {onClose && (
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                videoRef.current?.pause()
              } catch {}
              onClose()
            }}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
          >
            ＜
          </Button>
        </div>
      )}

      {/* Speaker toggle */}
      <div className="absolute top-6 right-6 z-10">
        <button
          type="button"
          onClick={onToggleMuted}
          className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
          aria-label={muted ? "ミュート解除" : "ミュートにする"}
        >
          <SpeakerIcon muted={muted} />
        </button>
      </div>

      <div className="absolute inset-0 flex">
        {/* Left content */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-32">
          <div className="text-white">
            <div className="mb-3">
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
                  {ownerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ownerAvatarUrl} alt={ownerHandle} className="w-full h-full object-cover" />
                  ) : (
                    ownerHandle.trim().replace(/^@/, "").charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <span className="text-white font-semibold text-sm">{ownerHandle}</span>
              </button>

              {post.title && (
                <div className="mb-2">
                  <p className="text-white text-sm">{post.title}</p>
                </div>
              )}
              {post.caption && <p className="text-xs text-gray-300 line-clamp-2">{post.caption}</p>}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <MediaActions
          className="w-16 justify-center pb-32"
          liked={liked}
          likeCount={likeCount}
          bookmarked={bookmarked}
          onToggleLike={onToggleLike}
          onToggleBookmark={onToggleBookmark}
          onShare={onShare}
          variant="overlay"
        />
      </div>

      {/* Bottom CTA */}
      {(onReserve || onMore) && (
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="flex gap-2">
            {onReserve && (
              <button
                type="button"
                onClick={onReserve}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                今すぐ予約する
              </button>
            )}
            {onMore && (
              <button
                type="button"
                onClick={onMore}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                もっと見る…
              </button>
            )}
          </div>
        </div>
      )}
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
