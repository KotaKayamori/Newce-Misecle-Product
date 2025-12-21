"use client"

import { RefreshCw } from "lucide-react"
import VideoCard from "@/components/VideoCard"
import { derivePosterUrl } from "@/app/search/utils"
import type { VideoData } from "@/hooks/useRandomVideos"

interface CategoryVideosSectionProps {
  visible: boolean
  categoryLabel: string
  videos: VideoData[]
  loading: boolean
  error: string | null
  bookmarkedVideoIds: Set<string>
  onRefresh: () => void
  onVideoSelect: (video: VideoData) => void
  onToggleFavorite: (id: string | number, e?: React.MouseEvent) => void
}

export function CategoryVideosSection({
  visible,
  categoryLabel,
  videos,
  loading,
  error,
  bookmarkedVideoIds,
  onRefresh,
  onVideoSelect,
  onToggleFavorite,
}: CategoryVideosSectionProps) {
  if (!visible) return null

  const hasVideos = videos.length > 0
  const showInitialLoading = loading && !hasVideos

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{categoryLabel}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{videos.length}件</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="動画を更新"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {hasVideos && (
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video) => {
            const user = video.user ?? {}
            const username = typeof user.username === "string" && user.username.trim().length > 0 ? user.username.trim() : null
            const displayName = typeof user.name === "string" && user.name.trim().length > 0 ? user.name.trim() : null
            const accountLabel = username ? `@${username}` : (displayName || "ユーザー")

            return (
              <VideoCard
                key={video.id}
                posterUrl={derivePosterUrl(video.public_url) || "/placeholder.jpg"}
                title={video.title}
                onClickCard={() => onVideoSelect(video)}
                thumbnailOnly
                showTopBookmark
                isBookmarked={bookmarkedVideoIds.has(video.id)}
                onToggleBookmark={(e) => onToggleFavorite(video.id, e)}
                bottomMetaVariant="account"
                accountAvatarUrl={user?.avatar_url ?? null}
                accountLabel={accountLabel}
              />
            )
          })}
        </div>
      )}

      {showInitialLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">動画を読み込み中...</div>
        </div>
      )}

      {!loading && !error && !hasVideos && (
        <div className="flex flex-col items-center py-12 text-gray-500">
          現在表示できる動画がありません
        </div>
      )}
    </div>
  )
}
