"use client"

import VideoCard from "@/components/VideoCard"
import { derivePosterUrl } from "@/app/search/utils"
import type { OwnerProfile, SupabaseVideoRow } from "../types"

interface SearchResultsSectionProps {
  visible: boolean
  searchTerm: string
  loading: boolean
  error: string | null
  results: SupabaseVideoRow[]
  ownerProfiles: Record<string, OwnerProfile>
  bookmarkedVideoIds: Set<string>
  onClear: () => void
  onRetry: () => void
  onSelectVideo: (video: SupabaseVideoRow) => void
  onToggleFavorite: (id: string | number, e?: React.MouseEvent) => void
}

export function SearchResultsSection({
  visible,
  searchTerm,
  loading,
  error,
  results,
  ownerProfiles,
  bookmarkedVideoIds,
  onClear,
  onRetry,
  onSelectVideo,
  onToggleFavorite,
}: SearchResultsSectionProps) {
  if (!visible) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">検索結果</h2>
        <div className="flex items-center gap-2">
          {loading && <span className="text-sm text-gray-600">検索中...</span>}
          {!loading && !error && (
            <span className="text-sm text-gray-600">{results.length}件</span>
          )}
          <button
            onClick={onClear}
            className="p-1 hover:bg-gray-100 rounded transition-colors text-sm text-gray-600"
            disabled={loading}
          >
            クリア
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center py-8">
          <div className="text-red-500 mb-2">{error}</div>
          <button onClick={onRetry} className="text-blue-600 hover:text-blue-700 underline">
            再試行
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">検索中...</div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-500">
          {searchTerm ? `「${searchTerm}」に一致する結果はありません` : "検索結果が見つかりませんでした"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((video) => {
            const ownerProfile = video.owner_id ? ownerProfiles[video.owner_id] : undefined
            const ownerHandle = ownerProfile?.username
              ? `@${ownerProfile.username}`
              : ownerProfile?.display_name || "ユーザー"
            const isBookmarked = bookmarkedVideoIds.has(video.id)

            return (
              <VideoCard
                key={video.id}
                posterUrl={derivePosterUrl(video.playback_url, video.storage_path) || "/placeholder.jpg"}
                title={video.title || video.caption || "動画"}
                onClickCard={() => onSelectVideo(video)}
                thumbnailOnly
                showTopBookmark
                isBookmarked={isBookmarked}
                onToggleBookmark={(e) => onToggleFavorite(video.id, e)}
                bottomMetaVariant="account"
                accountAvatarUrl={ownerProfile?.avatar_url}
                accountLabel={ownerHandle}
                accountUserId={video.owner_id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
