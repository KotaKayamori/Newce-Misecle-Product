"use client"

import AlbumCard from "@/components/AlbumCard"
import type { AlbumRow, OwnerProfile } from "@/app/favorites/types"
import { deriveAlbumCoverUrl } from "@/app/favorites/utils"

interface SavedAlbumsSectionProps {
  albums: AlbumRow[]
  loading: boolean
  ownerProfiles: Record<string, OwnerProfile>
  onAlbumClick: (album: AlbumRow) => void
  onToggleBookmark: (albumId: string) => void
}

export function SavedAlbumsSection({
  albums,
  loading,
  ownerProfiles,
  onAlbumClick,
  onToggleBookmark,
}: SavedAlbumsSectionProps) {
  if (loading) {
    return <div className="py-8 text-center text-gray-500">読み込み中…</div>
  }

  if (albums.length === 0) {
    return <div className="text-center py-12 text-gray-600">保存したアルバムがありません</div>
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {albums.map((album) => {
        const profile = ownerProfiles[album.owner_id]
        const label = profile?.username ? `@${profile.username}` : profile?.display_name || "ユーザー"
        return (
          <AlbumCard
            key={album.id}
            coverUrl={deriveAlbumCoverUrl(album.cover_path)}
            title={album.title || album.caption || "アルバム"}
            onClickCard={() => onAlbumClick(album)}
            showTopBookmark
            isBookmarked
            onToggleBookmark={(e) => {
              e.stopPropagation()
              onToggleBookmark(album.id)
            }}
            bottomMetaVariant="account"
            accountAvatarUrl={profile?.avatar_url ?? null}
            accountLabel={label}
          />
        )
      })}
    </div>
  )
}
