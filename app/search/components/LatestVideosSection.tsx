"use client"

import { useEffect } from "react"

import { CategoryVideosSection } from "./CategoryVideosSection"
import { useRandomVideos, type VideoData } from "@/hooks/useRandomVideos"

interface LatestVideosSectionProps {
  visible: boolean
  categoryLabel: string
  bookmarkedVideoIds: Set<string>
  onVideoSelect: (video: VideoData) => void
  onToggleFavorite: (id: string | number, e?: React.MouseEvent) => void
}

export function LatestVideosSection({
  visible,
  categoryLabel,
  bookmarkedVideoIds,
  onVideoSelect,
  onToggleFavorite,
}: LatestVideosSectionProps) {
  const { videos, loading, error, fetchVideos } = useRandomVideos()

  useEffect(() => {
    if (!visible) return
    fetchVideos(undefined, 10)
  }, [visible, fetchVideos])

  if (!visible) return null

  const handleRefresh = () => {
    fetchVideos(undefined, 10)
  }

  return (
    <CategoryVideosSection
      visible
      categoryLabel={categoryLabel}
      videos={videos}
      loading={loading}
      error={error}
      bookmarkedVideoIds={bookmarkedVideoIds}
      onRefresh={handleRefresh}
      onVideoSelect={onVideoSelect}
      onToggleFavorite={onToggleFavorite}
      /* CategoryVideosSection 内で thumbnailOnly を付けた VideoCard を使用 */
    />
  )
}
