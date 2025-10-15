"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Mode = "active" | "next" | "other"

export interface VideoItemProps {
  id: string
  playbackUrl: string
  mode: Mode
}

export default function VideoItem({ id, playbackUrl, mode }: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  // We start without src to avoid eager fetching; use data-src and set src only when needed
  const cancelTokenRef = useRef<number>(0)

  // TFF measurement using Performance API (console first, later sendBeacon)
  const tffLoggedRef = useRef<boolean>(false)

  const preloadAttr = useMemo(() => {
    // Initial attribute is none; we will mutate via effects per mode
    return "none"
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    // Increment token for this mode change
    const token = ++cancelTokenRef.current
    const isStale = () => token !== cancelTokenRef.current

    const dataSrc = el.getAttribute("data-src") || playbackUrl

    if (mode === "other") {
      // Deactivate and fully unload
      setIsReady(false)
      try {
        el.pause()
      } catch {}
      try {
        el.setAttribute("preload", "none")
        el.removeAttribute("src")
        el.load()
      } catch {}
      return
    }

    // Ensure src is set once for active/next
    const hasSrc = !!el.getAttribute("src")
    if (!hasSrc) {
      try {
        el.setAttribute("src", dataSrc)
        el.load()
        if (isStale()) {
          // If state changed during load, immediately cleanup
          el.removeAttribute("src")
          el.load()
          return
        }
      } catch {}
    }

    if (mode === "active") {
      try {
        el.setAttribute("preload", "auto")
        // Best-effort play; Safari inline requires muted+playsInline which we already set
        const p = el.play()
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (isStale()) {
              try { el.pause() } catch {}
            }
          }).catch(() => {})
        }
      } catch {}
    } else if (mode === "next") {
      try {
        el.setAttribute("preload", "metadata")
        el.pause()
      } catch {}
    }
  }, [mode, playbackUrl])

  // Reset TFF logging when mode changes
  useEffect(() => {
    tffLoggedRef.current = false
    // モードが変わったらサウンドは安全側でミュートに戻す（自動再生ポリシー対策）
    setIsMuted(true)
  }, [mode, id])

  const handleWaiting = () => {
    try { performance.mark(`waiting-${id}`) } catch {}
  }

  const reportTff = (ms: number) => {
    // eslint-disable-next-line no-console
    console.log("TFF", id, ms, "ms")
  }

  const handleLoadedData = () => {
    // Ignore if stale
    if (cancelTokenRef.current == null) return
    setIsReady(true)
    if (!tffLoggedRef.current) {
      try {
        performance.mark(`loaded-${id}`)
        performance.measure(`tff-${id}`, `waiting-${id}`, `loaded-${id}`)
        const entries = performance.getEntriesByName(`tff-${id}`, "measure")
        const last = entries[entries.length - 1]
        if (last) {
          reportTff(Math.round(last.duration))
          tffLoggedRef.current = true
        }
      } catch {}
      try {
        performance.clearMarks(`waiting-${id}`)
        performance.clearMarks(`loaded-${id}`)
        performance.clearMeasures(`tff-${id}`)
      } catch {}
    }
  }

function derivePosterUrl(playbackUrl: string): string | null {
  try {
    const u = new URL(playbackUrl)
    const pathname = u.pathname || ""
    // 拡張子を判定（.mp4|.mov|.m4v のみ対象。m3u8 等は無視）
    const m = pathname.match(/\.([a-zA-Z0-9]+)$/)
    const ext = (m?.[1] || "").toLowerCase()
    if (!/(mp4|mov|m4v)$/.test(ext)) return null
    const webpPath = pathname.replace(/\.(mp4|mov|m4v)$/i, ".webp")
    u.pathname = webpPath
    // 署名パラメータ等は不要なので、? 以降は取り除く
    u.search = ""
    u.hash = ""
    return u.toString()
  } catch {
    // URL でない（相対等）の場合も安全側に：拡張子が対象なら置換
    if (/(mp4|mov|m4v)$/i.test(playbackUrl.split('?')[0])) {
      return playbackUrl.split('?')[0].replace(/\.(mp4|mov|m4v)$/i, ".webp")
    }
    return null
  }
}

  const handlePlaying = () => {
    if (cancelTokenRef.current == null) return
    setIsReady(true)
  }

  return (
    <div className="relative h-screen w-screen">
      <video
        ref={videoRef}
        data-reel
        // Start without src; we will set it from data-src when needed
        src={undefined}
        poster={derivePosterUrl(playbackUrl) || "/placeholder.jpg"}
        muted={isMuted}
        playsInline
        {...{ 'webkit-playsinline': 'true' }}
        loop
        controls={false}
        preload={preloadAttr as any}
        data-src={playbackUrl}
        autoPlay={mode === "active"}
        onLoadedData={handleLoadedData}
        onCanPlay={handleLoadedData}
        onCanPlayThrough={handleLoadedData}
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onStalled={handleWaiting}
        className="w-full h-full object-cover"
      />

      {/* Mute/Unmute toggle for active item */}
      {mode === "active" && (
        <div
          className="absolute right-4 z-30"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}
        >
          <button
            onClick={() => {
              const next = !isMuted
              setIsMuted(next)
              const el = videoRef.current
              if (el) {
                try {
                  el.muted = next
                  if (!next) {
                    el.volume = 1
                    el.play().catch(() => {})
                  }
                } catch {}
              }
            }}
            className="px-3 py-2 rounded-full bg-black/50 text-white text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      )}

      {/* LQIP + Spinner overlay */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-300"
        style={{ opacity: isReady ? 0 : 1, pointerEvents: "none" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/placeholder.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(12px)",
            transform: "scale(1.05)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <div className="mt-3 text-sm text-gray-200">loading...</div>
        </div>
      </div>
    </div>
  )
}


