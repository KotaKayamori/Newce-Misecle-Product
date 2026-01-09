"use client"

import AlbumCard from "@/components/AlbumCard"
import VideoCard from "@/components/VideoCard"
import { derivePosterUrl } from "@/app/search/utils"
import type { AlbumItem } from "@/lib/types"
import type { VideoData } from "@/hooks/useRandomVideos"

type MixedItem =
  | { kind: "video"; video: VideoData }
  | { kind: "album"; album: AlbumItem }

interface MixedFeedSectionProps {
  visible: boolean
  items: MixedItem[]
  bookmarkedVideoIds: Set<string>
  albumBookmarkedSet: Set<string>
  onVideoSelect: (video: VideoData) => void
  onOpenAlbum: (album: AlbumItem) => void
  onToggleVideoBookmark: (id: string | number, e?: React.MouseEvent) => void
  onToggleAlbumBookmark: (albumId: string, e?: React.MouseEvent) => void
}

export default function MixedFeedSection({
  visible,
  items,
  bookmarkedVideoIds,
  albumBookmarkedSet,
  onVideoSelect,
  onOpenAlbum,
  onToggleVideoBookmark,
  onToggleAlbumBookmark,
}: MixedFeedSectionProps) {
  if (!visible) return null
  return (
    <div className="columns-2 gap-3 space-y-3">
      {items.map((it, idx) =>
        it.kind === "video" ? (
          <div key={`v-${it.video.id}-${idx}`} className="break-inside-avoid mb-3">
            <VideoCard
              posterUrl={derivePosterUrl(it.video.public_url) || "/placeholder.jpg"}
              title={it.video.title}
              onClickCard={() => onVideoSelect(it.video)}
              thumbnailOnly
              showTopBookmark
              isBookmarked={bookmarkedVideoIds.has(it.video.id)}
              onToggleBookmark={(e) => onToggleVideoBookmark(it.video.id, e)}
              bottomMetaVariant="account"
              accountAvatarUrl={it.video.user?.avatar_url ?? null}
              accountLabel={
                it.video.user?.username ? `@${it.video.user.username}` : (it.video.user?.name || "ユーザー")
              }
              accountUserId={it.video.user?.id ?? null}
            />
          </div>
        ) : (
          <div key={`a-${it.album.id}-${idx}`} className="break-inside-avoid mb-3">
            <AlbumCard
              coverUrl={it.album.coverUrl}
              title={it.album.title || it.album.description || "アルバム"}
              onClickCard={() => onOpenAlbum(it.album)}
              showTopBookmark
              isBookmarked={albumBookmarkedSet.has(it.album.id)}
              onToggleBookmark={(e) => onToggleAlbumBookmark(it.album.id, e)}
              bottomMetaVariant="account"
              accountAvatarUrl={it.album.owner?.avatarUrl ?? null}
              accountLabel={
                it.album.owner?.username ? `@${it.album.owner.username}` : (it.album.owner?.displayName || "ユーザー")
              }
              accountUserId={it.album.owner?.id ?? null}
            />
          </div>
        )
      )}
    </div>
  )
}