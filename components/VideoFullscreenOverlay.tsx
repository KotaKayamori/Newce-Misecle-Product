"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Bookmark, Send } from "lucide-react"

export interface FullscreenVideoData {
  id: string
  playback_url: string
  poster_url?: string | null
  title?: string | null
  caption?: string | null
}

interface VideoFullscreenOverlayProps {
  open: boolean
  video: FullscreenVideoData
  ownerHandle: string
  ownerAvatarUrl?: string | null
  liked: boolean
  likeCount?: number
  onToggleLike: () => void
  bookmarked: boolean
  onToggleBookmark: () => void
  onShare: () => Promise<void> | void
  onClose: () => void
  onReserve: () => void
  onMore: () => void
  muted: boolean
  onToggleMuted: () => void
}

export default function VideoFullscreenOverlay(props: VideoFullscreenOverlayProps) {
  const {
    open,
    video,
    ownerHandle,
    ownerAvatarUrl,
    liked,
    likeCount = 0,
    onToggleLike,
    bookmarked,
    onToggleBookmark,
    onShare,
    onClose,
    onReserve,
    onMore,
    muted,
    onToggleMuted,
  } = props

  const videoRef = useRef<HTMLVideoElement | null>(null)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        src={video.playback_url}
        className="w-full h-full object-cover"
        poster={video.poster_url || "/placeholder.jpg"}
        muted={muted}
        loop
        autoPlay
        playsInline
        {...{ 'webkit-playsinline': 'true' }}
        preload="auto"
        controls={false}
      />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            try { videoRef.current?.pause() } catch {}
            onClose()
          }}
          className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
        >
          ＜
        </Button>
      </div>

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

              {video.title && (
                <div className="mb-2">
                  <p className="text-white text-sm">{video.title}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="w-16 flex flex-col items-center justify-center pb-32 gap-6">
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 flex items-center justify-center" onClick={onToggleLike} aria-label={liked ? "いいね解除" : "いいね"}>
              <Heart className={`w-8 h-8 text-white drop-shadow-lg ${liked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <span className="text-white text-xs font-medium drop-shadow-lg mt-1">{likeCount}</span>
          </div>

          <div className="flex flex-col items-center">
            <button className="w-12 h-12 flex items-center justify-center" onClick={onToggleBookmark} aria-label={bookmarked ? "ブックマーク解除" : "ブックマーク"}>
              <Bookmark className={`w-8 h-8 drop-shadow-lg ${bookmarked ? "fill-white text-white" : "text-white"}`} />
            </button>
          </div>

          <div className="flex flex-col items-center">
            <button className="w-12 h-12 flex items-center justify-center" onClick={() => onShare()} aria-label="共有">
              <Send className="w-8 h-8 text-white drop-shadow-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-16 left-0 right-0 px-4">
        <div className="flex gap-2">
          <button type="button" onClick={onReserve} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            今すぐ予約する
          </button>
          <button type="button" onClick={onMore} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            もっと見る…
          </button>
        </div>
      </div>
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


