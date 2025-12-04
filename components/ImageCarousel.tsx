"use client"

import React, { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type ImageCarouselProps = {
  images: string[]
  currentIndex: number
  onIndexChange: (nextIndex: number) => void
  className?: string
  imageClassName?: string
  fit?: "cover" | "contain"
}

function clamp(index: number, min: number, max: number) {
  return Math.max(min, Math.min(index, max))
}

function useImagePreload(urls: string[], index: number, radius: number = 1) {
  useEffect(() => {
    if (!urls || urls.length === 0) return
    const targets = new Set<number>()
    for (let i = index - radius; i <= index + radius; i += 1) {
      if (i >= 0 && i < urls.length) targets.add(i)
    }
    targets.forEach((idx) => {
      const url = urls[idx]
      if (!url) return
      const img = new Image()
      img.src = url
    })
  }, [urls, index, radius])
}

export function ImageCarousel({
  images,
  currentIndex,
  onIndexChange,
  className,
  imageClassName,
  fit = "cover",
}: ImageCarouselProps) {
  const hasImages = images.length > 0
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartX = useRef(0)
  const translatePercent = -currentIndex * 100
  useImagePreload(images, currentIndex, 1)

  useEffect(() => {
    setDragOffset(0)
    setIsDragging(false)
  }, [currentIndex])

  const goTo = (next: number) => {
    if (!hasImages) return
    const clamped = clamp(next, 0, images.length - 1)
    if (clamped === currentIndex) return
    onIndexChange(clamped)
  }

  const canPrev = currentIndex > 0
  const canNext = currentIndex < images.length - 1

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasImages) return
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

  const trackStyle: React.CSSProperties = hasImages
    ? {
        transform: isDragging
          ? `translateX(calc(${translatePercent}% + ${dragOffset}px))`
          : `translateX(${translatePercent}%)`,
        transition: isDragging ? "none" : "transform 300ms ease-out",
      }
    : {}

  if (!hasImages) {
    return (
      <div className={`aspect-[4/5] w-full rounded-2xl bg-gray-800/20 text-white flex items-center justify-center ${className ?? ""}`}>
        画像がありません
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
          {images.map((src, idx) => (
            <div key={`${src}-${idx}`} className="w-full flex-shrink-0 basis-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`carousel-${idx}`}
                className={cn(
                  "select-none pointer-events-none",
                  fit === "cover" ? "h-full w-full object-cover" : "w-full h-auto object-contain",
                  imageClassName,
                )}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
