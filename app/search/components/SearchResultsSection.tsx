"use client"

import VideoCard from "@/components/VideoCard"
import AlbumCard from "@/components/AlbumCard"
import { derivePosterUrl } from "@/app/search/utils"
import type { OwnerProfile, SearchResults, SupabaseVideoRow, AlbumItem } from "@/lib/types"

interface SearchResultsSectionProps {
  visible: boolean
  searchTerm: string
  loading: boolean
  error: string | null
  results: SearchResults
  ownerProfiles: Record<string, OwnerProfile>
  bookmarkedVideoIds: Set<string>
  onClear: () => void
  onRetry: () => void
  onSelectVideo: (video: SupabaseVideoRow) => void
  onSelectAlbum?: (albumId: string) => void
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
  onSelectAlbum,
  onToggleFavorite,
}: SearchResultsSectionProps) {
  if (!visible) return null
  const { videos, albums } = results

  if (visible && !loading) {
    console.log("SearchResultsSection Data:", {
      searchTerm,
      videoCount: results.videos.length,
      albumCount: results.albums.length,
      availableProfileIds: Object.keys(ownerProfiles),
      ownerProfiles
    });
  }

  // 動画とアルバムをcreatedAtで混在ソート
  const merged = [
    ...videos.map((v) => ({ type: "video" as const, data: v, createdAt: v.created_at })),
    ...albums.map((a) => ({ type: "album" as const, data: a, createdAt: a.createdAt || "" })),
  ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">検索結果</h2>
        <div className="flex items-center gap-2">
          {loading && <span className="text-sm text-gray-600">検索中...</span>}
          {!loading && !error && (
            <span className="text-sm text-gray-600">{videos.length + albums.length}件</span>
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
      ) : merged.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-500">
          {searchTerm ? `「${searchTerm}」に一致する結果はありません` : "検索結果が見つかりませんでした"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {merged.map((item) =>
            item.type === "video" ? (
              <VideoCard
                key={item.data.id}
                posterUrl={derivePosterUrl(item.data.playback_url, item.data.storage_path) || "/placeholder.jpg"}
                title={item.data.title || item.data.caption || "動画"}
                onClickCard={() => onSelectVideo(item.data)}
                thumbnailOnly
                showTopBookmark
                isBookmarked={bookmarkedVideoIds.has(item.data.id)}
                onToggleBookmark={(e) => onToggleFavorite(item.data.id, e)}
                bottomMetaVariant="account"
                accountAvatarUrl={item.data.owner_id ? ownerProfiles[item.data.owner_id]?.avatar_url : undefined}
                accountLabel={
                  item.data.owner_id
                    ? ownerProfiles[item.data.owner_id]?.username
                      ? `@${ownerProfiles[item.data.owner_id]?.username}`
                      : ownerProfiles[item.data.owner_id]?.display_name || "ユーザー"
                    : "ユーザー"
                }
                accountUserId={item.data.owner_id}
              />
            ) : (
              <AlbumCard
                key={item.data.id}
                coverUrl={item.data.coverUrl}
                title={item.data.title}
                description={item.data.description}
                onClickCard={() => onSelectAlbum && onSelectAlbum(item.data.id)}
                bottomMetaVariant="account"
                accountAvatarUrl={item.data.owner?.avatarUrl}
                accountLabel={item.data.owner?.username ? `@${item.data.owner.username}` : item.data.owner?.displayName}
                accountUserId={item.data.owner?.id}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}