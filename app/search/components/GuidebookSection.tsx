"use client"

import { RefreshCw } from "lucide-react"
import AlbumCard from "@/components/AlbumCard"
import type { AlbumItem } from "@/lib/types"

interface GuidebookSectionProps {
  visible: boolean
  categoryLabel: string
  albums: AlbumItem[]
  loading: boolean
  error: string | null
  albumBookmarkedSet: Set<string>
  onRefresh: () => void
  onOpenAlbum: (albumId: string) => void
  onToggleBookmark: (albumId: string) => void
}

export function GuidebookSection({
  visible,
  categoryLabel,
  albums,
  loading,
  error,
  albumBookmarkedSet,
  onRefresh,
  onOpenAlbum,
  onToggleBookmark,
}: GuidebookSectionProps) {
  if (!visible) return null

  const hasAlbums = albums.length > 0
  const showInitialLoading = loading && !hasAlbums

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}

      {hasAlbums && !error && (
        <div className="grid grid-cols-2 gap-3">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              coverUrl={album.coverUrl}
              title={album.title || album.description || "アルバム"}
              onClickCard={() => onOpenAlbum(album.id)}
              showTopBookmark
              isBookmarked={albumBookmarkedSet.has(album.id)}
              onToggleBookmark={(e) => {
                e.stopPropagation()
                onToggleBookmark(album.id)
              }}
              bottomMetaVariant="account"
              accountAvatarUrl={album.owner?.avatarUrl ?? null}
              accountLabel={album.owner?.username ? `@${album.owner.username}` : album.owner?.displayName || "ユーザー"}
              accountUserId={album.owner?.id ?? null}
            />
          ))}
        </div>
      )}

      {showInitialLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">アルバムを読み込み中...</div>
        </div>
      )}

      {!loading && !error && !hasAlbums && (
        <div className="flex flex-col items-center py-12 text-gray-500">
          現在表示できるアルバムがありません
        </div>
      )}
    </div>
  )
}
