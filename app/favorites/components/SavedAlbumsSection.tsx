"use client"

import AlbumCard from "@/components/AlbumCard"
import type { AlbumRow, OwnerProfile } from "@/lib/types"
import { deriveAlbumCoverUrl } from "@/lib/media"
import { Image as ImageIcon } from "lucide-react"

interface SavedAlbumsSectionProps {
  albums: AlbumRow[]
  loading: boolean
  needLogin: boolean
  ownerProfiles: Record<string, OwnerProfile>
  onAlbumClick: (album: AlbumRow) => void
  onToggleBookmark: (albumId: string) => void
  onLoginRequest: () => void
  onExploreAlbums: () => void
}

export function SavedAlbumsSection({
  albums,
  loading,
  needLogin,
  ownerProfiles,
  onAlbumClick,
  onToggleBookmark,
  onLoginRequest,
  onExploreAlbums,
}: SavedAlbumsSectionProps) {
  if (loading) {
    return <div className="py-8 text-center text-gray-500">読み込み中…</div>
  }

  if (needLogin) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">ログインが必要です</h3>
        <p className="text-gray-500 mb-4">ログインして、保存したアルバムを見ましょう</p>
        <button
          onClick={onLoginRequest}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
        >
          ログイン
        </button>
      </div>
    )
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">保存したアルバムがありません</h3>
        <p className="text-gray-500 mb-4">気になるアルバムを見つけてブックマークしましょう</p>
        <button
          onClick={onExploreAlbums}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
        >
          動画を見る
        </button>
      </div>
    )
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
            accountUserId={album.owner_id}
          />
        )
      })}
    </div>
  )
}
