"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Bookmark, Send } from "lucide-react"
import { useVisualViewportVars } from "@/hooks/useVisualViewportVars"

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
  variant?: "overlay" | "reels"
}

export default function VideoFullscreenOverlay(props: VideoFullscreenOverlayProps) {
  useVisualViewportVars()
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
    variant = "overlay",
  } = props

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPercent, setSeekPercent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [previewThumb, setPreviewThumb] = useState<string | null>(null)
  const [lastThumbAt, setLastThumbAt] = useState(0)
  const seekContainerRef = useRef<HTMLDivElement | null>(null)
  const [previewX, setPreviewX] = useState<number | null>(null)

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
  const applySeek = (percentage: number, forPreview = false) => {
    const v = videoRef.current
    if (!v || !duration) return
    const clamped = Math.min(Math.max(percentage, 0), 1)
    const newTime = duration * clamped

    if (forPreview) {
      // プレビュー用に time だけ更新（確定はしない想定ならここで v.currentTime を動かさない選択肢もある）
      setPreviewTime(newTime)
      setSeekPercent(clamped)
      updatePreviewThumbnail(newTime)
    } else {
      v.currentTime = newTime
      setCurrentTime(newTime)
      setSeekPercent(clamped)
      setPreviewTime(null)
    }
  }

  const handleSeekStart = (clientX: number, rect: DOMRect) => {
    setIsSeeking(true)
    const p = (clientX - rect.left) / rect.width
    updatePreviewPosition(clientX, rect)
    applySeek(p, true)
  }

  const handleSeekMove = (clientX: number, rect: DOMRect) => {
    if (!isSeeking) return
    const p = (clientX - rect.left) / rect.width
    updatePreviewPosition(clientX, rect)
    applySeek(p, true)
  }


  const handleSeekEnd = () => {
    if (!isSeeking) return
    setIsSeeking(false)
    setPreviewX(null)

    // previewTime が入っていれば、その時点に確定シーク
    if (previewTime != null && duration) {
      const v = videoRef.current
      if (v) {
        v.currentTime = previewTime
        setCurrentTime(previewTime)
        setSeekPercent(previewTime / duration)
      }
    }
    setPreviewTime(null)
  }

  const formatTime = (sec: number) => {
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, "0")}`
  }

  const updatePreviewPosition = (clientX: number, rect: DOMRect) => {
    const thumbW = 96 // サムネ実幅（w-24）
    const xCenter = clientX - rect.left
    // 左端座標を計算してクランプ
    let left = xCenter - thumbW / 2
    if (left < 0) left = 0
    if (left > rect.width - thumbW) left = rect.width - thumbW
    setPreviewX(left)
  }

  const updatePreviewThumbnail = (time: number) => {
    const src = video.playback_url
    let pv = previewVideoRef.current
    let cv = previewCanvasRef.current

    if (!pv) {
      pv = document.createElement("video")
      pv.crossOrigin = "anonymous"
      pv.preload = "auto"
      pv.muted = true
      pv.playsInline = true
      pv.src = src
      previewVideoRef.current = pv
    }
    if (!cv) {
      cv = document.createElement("canvas")
      previewCanvasRef.current = cv
    }

    const targetW = 90 // 小サムネ幅
    const targetH = 160  // 9:16 高さ
    cv.width = targetW
    cv.height = targetH

    const drawFrame = () => {
      const ctx = cv!.getContext("2d")
      if (!ctx) return
      try {
        // 動画のアスペクトを維持して中央トリミング
        const vw = pv!.videoWidth || targetW
        const vh = pv!.videoHeight || targetH
        if (vw === 0 || vh === 0) return

        const scale = Math.max(targetW / vw, targetH / vh)
        const dw = vw * scale
        const dh = vh * scale
        const dx = (targetW - dw) / 2
        const dy = (targetH - dh) / 2
        ctx.clearRect(0, 0, targetW, targetH)
        ctx.drawImage(pv!, dx, dy, dw, dh)
        const url = cv!.toDataURL("image/jpeg", 0.7)
        setPreviewThumb(url)
      } catch (err) {
        console.error("Error drawing video frame to canvas:", err);
      }
    }

    const onSeeked = () => {
      pv!.removeEventListener("seeked", onSeeked)
      drawFrame()
    }

    // 軽いスロットリング（60ms）
    const now = performance.now()
    if (now - lastThumbAt < 60) return
    setLastThumbAt(now)

    if (Number.isFinite(time)) {
      // メタデータ読み込み後にシーク
      if (pv!.readyState >= 1) {
        pv!.addEventListener("seeked", onSeeked)
        pv!.currentTime = Math.min(Math.max(time, 0), pv!.duration || time)
      } else {
        pv!.addEventListener("loadedmetadata", () => {
          pv!.addEventListener("seeked", onSeeked)
          pv!.currentTime = Math.min(Math.max(time, 0), pv!.duration || time)
        }, { once: true })
      }
    }
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

  const isReels = variant === "reels"
  const rootClass = isReels
    ? "absolute inset-0 z-40 bg-black touch-pan-y [--footer-h:57px]"
    : "fixed left-0 right-0 top-0 w-screen h-[var(--vvh)] translate-y-[var(--vvt)] z-40 bg-black [--footer-h:57px]"

  return (
    <div className={rootClass}>
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
      />

      {/* クリック判定用の透明レイヤ（video 全体をカバー） */}
      <button
        type="button"
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          handleTogglePlay()
        }}
        aria-label="再生/一時停止"
      />

      {/* Back button */}
      <div className="absolute left-6 top-[calc(env(safe-area-inset-top)+var(--vvt)+16px)] z-30">
        <Button
          variant="ghost"
          size="icon"                     // アイコンボタンサイズ
          onClick={() => {
            try { videoRef.current?.pause() } catch {}
            onClose()
          }}
          className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white border-none"
        >
          ＜
        </Button>
      </div>

      {/* Speaker toggle */}
      <div className="absolute right-6 top-[calc(env(safe-area-inset-top)+var(--vvt)+16px)] z-30">
        <button
          type="button"
          onClick={onToggleMuted}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition"
          aria-label={muted ? "ミュート解除" : "ミュートにする"}
        >
          <SpeakerIcon muted={muted} />
        </button>
      </div>

      <div className="absolute inset-0 flex">
        {/* Left content */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-[calc(env(safe-area-inset-bottom)+var(--vvb)+var(--footer-h,57px)+96px)]">
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
        <div className="w-16 flex flex-col items-center justify-end pb-[calc(env(safe-area-inset-bottom)+var(--vvb)+var(--footer-h,57px)+96px)] gap-6">
          <div className="flex flex-col items-center z-30">
            <button className="w-12 h-12 flex items-center justify-center" onClick={onToggleLike} aria-label={liked ? "いいね解除" : "いいね"}>
              <Heart
                className={`w-8 h-8 ${liked ? "fill-red-500 text-transparent" : "text-white"}`}
                style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))", ...(liked ? { stroke: 'none' } : {}) }}
              />
            </button>
            {/* <span
              className="text-white text-xs font-medium mt-1"
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
            >
              {likeCount}
            </span> */}
            <div className="relative h-4 w-16 overflow-hidden">
              <div className="absolute whitespace-nowrap text-[12px] text-white animate-marquee">
                いいね！ いいね！ いいね！ いいね！
              </div>
            </div>
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
      <div className="absolute left-0 right-0 px-4 z-30 bottom-[calc(env(safe-area-inset-bottom)+var(--vvb)+var(--footer-h,57px)+32px)]">
        <div className="flex gap-2">
          <button type="button" onClick={onReserve} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            今すぐ予約する
          </button>
          <button type="button" onClick={onMore} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
            もっと見る…
          </button>
        </div>
      </div>

      {/* ★ 動画とフッターの“間”にシークバーを配置 */}
      <div className="absolute inset-x-0 z-30 bottom-[calc(env(safe-area-inset-bottom)+var(--vvb)+var(--footer-h,57px))]">
        <div className="w-full h-8 flex items-center">
          <div
            ref={seekContainerRef}
            className="relative w-full h-full touch-pan-x select-none"
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
            {isSeeking && previewTime != null && previewThumb && previewX != null && (
              <div
                className="absolute -top-44 w-24 rounded-lg bg-black/60 backdrop-blur-sm border border-white/15 shadow-xl pointer-events-none overflow-hidden"
                style={{ left: `${previewX}px` }}
              >
                <img
                  src={previewThumb}
                  alt="プレビュー"
                  className="w-full h-40 object-cover"
                  draggable={false}
                />
              </div>
            )}

            {isSeeking && previewTime != null && previewX != null && (
              <div
                className="absolute -top-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs pointer-events-none whitespace-nowrap leading-none"
                style={{
                  left: `${previewX + 48}px`, // 96px / 2 = 48
                  transform: "translateX(-50%)"
                }}
              >
                {formatTime(previewTime)} / {formatTime(duration)}
              </div>
            )}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/25 backdrop-blur-sm">
              <div className="relative w-full h-1 bg-white/30 rounded-full">
                <div className="absolute inset-0 rounded-full bg-white/20" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
                  style={{ width: `${progress * 100}%` }}
                />              
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 画面中央の再生ボタン（停止中のみ表示） */}
      {!isPlaying && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center z-20"
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
