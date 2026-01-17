"use client"

import React, { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type MediaItem = {
  url: string
  type?: "image" | "video"
}

type MediaCarouselProps = {
  items: MediaItem[]
  currentIndex: number
  onIndexChange: (nextIndex: number) => void
  className?: string
  mediaClassName?: string
  fit?: "cover" | "contain"
}

function clamp(index: number, min: number, max: number) {
  return Math.max(min, Math.min(index, max))
}

function useImagePreload(items: MediaItem[], index: number, radius: number = 1) {
  useEffect(() => {
    if (!items || items.length === 0) return
    const targets = new Set<number>()
    for (let i = index - radius; i <= index + radius; i += 1) {
      if (i >= 0 && i < items.length) targets.add(i)
    }
    targets.forEach((idx) => {
      const item = items[idx]
      if (!item || item.type === "video") return
      const img = new Image()
      img.src = item.url
    })
  }, [items, index, radius])
}

export function MediaCarousel({
  items,
  currentIndex,
  onIndexChange,
  className,
  mediaClassName,
  fit = "cover",
}: MediaCarouselProps) {
  const hasItems = items.length > 0
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartX = useRef(0)
  const translatePercent = -currentIndex * 100

  useImagePreload(items, currentIndex, 1)

  useEffect(() => {
    setDragOffset(0)
    setIsDragging(false)
    videoRefs.current.forEach((video, idx) => {
      if (!video) return
      if (idx !== currentIndex) {
        try {
          video.pause()
          video.currentTime = 0
        } catch {}
      }
    })
  }, [currentIndex])

  const goTo = (next: number) => {
    if (!hasItems) return
    const clamped = clamp(next, 0, items.length - 1)
    if (clamped === currentIndex) return
    onIndexChange(clamped)
  }

  const canPrev = currentIndex > 0
  const canNext = currentIndex < items.length - 1

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasItems) return
    touchStartX.current = event.touches[0].clientX
    setDragOffset(0)
    setIsDragging(true)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const deltaX = event.touches[0].clientX - touchStartX.current
    setDragOffset(deltaX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    const width = containerRef.current?.clientWidth ?? 1
    const ratio = Math.abs(dragOffset) / width
    if (ratio > 0.25) {
      if (dragOffset < 0 && canNext) goTo(currentIndex + 1)
      else if (dragOffset > 0 && canPrev) goTo(currentIndex - 1)
    }
    setDragOffset(0)
    setIsDragging(false)
  }

  const handleVideoTap = (video: HTMLVideoElement | null) => {
    if (!video || isDragging) return
    video.muted = !video.muted
  }

  const trackStyle: React.CSSProperties = hasItems
    ? {
        transform: isDragging
          ? `translateX(calc(${translatePercent}% + ${dragOffset}px))`
          : `translateX(${translatePercent}%)`,
        transition: isDragging ? "none" : "transform 300ms ease-out",
      }
    : {}

  if (!hasItems) {
    return (
      <div className={cn("aspect-[4/5] w-full rounded-2xl bg-gray-800/20 text-white flex items-center justify-center", className)}>
        メディアがありません
      </div>
    )
  }

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div
        ref={containerRef}
        className="relative w-full select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex" style={trackStyle}>
          {items.map((item, idx) => (
            <div key={`${item.url}-${idx}`} className="w-full flex-shrink-0 basis-full flex items-center justify-center">
              {item.type === "video" ? (
                <video
                  ref={(el) => { videoRefs.current[idx] = el }}
                  src={item.url}
                  className={cn(
                    "select-none",
                    fit === "cover" ? "h-full w-full object-cover" : "h-full w-full object-contain",
                    mediaClassName,
                  )}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  onClick={() => handleVideoTap(videoRefs.current[idx])}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={`carousel-${idx}`}
                  className={cn(
                    "select-none pointer-events-none",
                    fit === "cover" ? "h-full w-full object-cover" : "h-full w-full object-contain",
                    mediaClassName,
                  )}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
