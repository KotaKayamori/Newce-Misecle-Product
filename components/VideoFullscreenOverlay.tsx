"use client"

import { useRef, useState, useEffect } from "react"
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
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)  
  const [seekPercent, setSeekPercent] = useState(0)  
  const [isPlaying, setIsPlaying] = useState(true)

  // 再生/一時停止トグル
  const handleTogglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  // シーク処理本体：0〜1 の割合から currentTime を決める
  const applySeek = (percentage: number) => {
    const v = videoRef.current
    if (!v || !duration) return
    const clamped = Math.min(Math.max(percentage, 0), 1)
    const newTime = duration * clamped
    v.currentTime = newTime
    setCurrentTime(newTime)
    setSeekPercent(clamped)
  }

  // シーク開始/ドラッグ/終了用ハンドラ
  const handleSeekStart = (clientX: number, rect: DOMRect) => {
    setIsSeeking(true)
    const p = (clientX - rect.left) / rect.width
    applySeek(p)
  }

  const handleSeekMove = (clientX: number, rect: DOMRect) => {
    if (!isSeeking) return
    const p = (clientX - rect.left) / rect.width
    applySeek(p)
  }

  const handleSeekEnd = () => {
    setIsSeeking(false)
  }

  // timeupdate / loadedmetadata で状態更新
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onLoaded = () => {
      if (!Number.isNaN(v.duration)) {
        setDuration(v.duration)
      }
    }
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime)
      if (!isSeeking && v.duration) {
        setSeekPercent(v.currentTime / v.duration)
      }
    }

    v.addEventListener("loadedmetadata", onLoaded)
    v.addEventListener("timeupdate", onTimeUpdate)

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded)
      v.removeEventListener("timeupdate", onTimeUpdate)
    }
  }, [video.playback_url, isSeeking])

  const progress = duration ? seekPercent : 0

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
        {...{ "webkit-playsinline": "true" }}
        preload="auto"
        controls={false}
        // onClick={(e) => {
        //   console.log("クリック")
        //   e.stopPropagation()
        //   handleTogglePlay()
        // }}
      />

      {/* クリック判定用の透明レイヤ（video 全体をカバー） */}
      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={(e) => {
          console.log("クリック")
          e.stopPropagation()
          handleTogglePlay()
        }}
        aria-label="再生/一時停止"
      />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-30">
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
      <div className="absolute top-6 right-6 z-30">
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
          <div className="text-white z-30">
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
          <div className="flex flex-col items-center z-30">
            <button className="w-12 h-12 flex items-center justify-center" onClick={onToggleLike} aria-label={liked ? "いいね解除" : "いいね"}>
              <Heart
                className={`w-8 h-8 ${liked ? "fill-red-500 text-transparent" : "text-white"}`}
                style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))", ...(liked ? { stroke: 'none' } : {}) }}
              />
            </button>
            <span
              className="text-white text-xs font-medium mt-1"
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
            >
              {likeCount}
            </span>
          </div>

          <div className="flex flex-col items-center z-30">
            <button className="w-12 h-12 flex items-center justify-center" onClick={onToggleBookmark} aria-label={bookmarked ? "ブックマーク解除" : "ブックマーク"}>
              <Bookmark
                className={`w-8 h-8 ${bookmarked ? "fill-orange-500 text-orange-500" : "text-white"}`}
                style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
              />
            </button>
          </div>

          <div className="flex flex-col items-center z-30">
            <button className="w-12 h-12 flex items-center justify-center" onClick={() => onShare()} aria-label="共有">
              <Send
                className="w-8 h-8 text-white"
                style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-24 left-0 right-0 px-4 z-30">
        <div className="flex gap-2">
          <button type="button" onClick={onReserve} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            今すぐ予約する
          </button>
          <button type="button" onClick={onMore} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            もっと見る…
          </button>
        </div>
      </div>

      {/* === ここに横スクロールのシークバーを追加 === */}
      {/* シークバー部分：ドラッグ対応＆リッチな見た目 */}
      <div className="absolute bottom-16 left-0 right-0 px-4 z-30">
        <div
          className="w-full h-5 rounded-full bg-white/25 backdrop-blur-sm px-1 flex items-center"
        >
          <div
            className="relative w-full h-1.5 bg-white/30 rounded-full touch-pan-x"
            // マウス
            onMouseDown={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              handleSeekStart(e.clientX, rect)
            }}
            onMouseMove={(e) => {
              if (!isSeeking) return
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              handleSeekMove(e.clientX, rect)
            }}
            onMouseUp={handleSeekEnd}
            onMouseLeave={() => {
              if (isSeeking) handleSeekEnd()
            }}
            // タッチ
            onTouchStart={(e) => {
              const touch = e.touches[0]
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              handleSeekStart(touch.clientX, rect)
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0]
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
              handleSeekMove(touch.clientX, rect)
            }}
            onTouchEnd={handleSeekEnd}
          >
            {/* 背景トラック */}
            <div className="absolute inset-0 rounded-full bg-white/20" />
            {/* 進捗バー（終端=動画終わり） */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
              style={{ width: `${progress * 100}%` }}
            />
            {/* ハンドル */}
            <div
              className="absolute -top-1.5 w-4 h-4 rounded-full bg-white shadow-md border border-black/10"
              style={{ left: `calc(${progress * 100}% - 8px)` }}
            />
          </div>
        </div>
      </div>
      {/* 画面中央の再生ボタン（停止中のみ表示） */}
      {!isPlaying && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center z-30"
          onClick={(e) => {
            e.stopPropagation()
            handleTogglePlay()
          }}
          aria-label="再生"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-l-[18px] border-l-white border-t-[11px] border-t-transparent border-b-[11px] border-b-transparent ml-1" />
          </div>
        </button>
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


