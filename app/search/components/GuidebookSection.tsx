"use client"

import { RefreshCw } from "lucide-react"
import AlbumCard from "@/components/AlbumCard"
import type { AlbumItem } from "../types"

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{categoryLabel}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{albums.length}件</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="アルバムを更新"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
