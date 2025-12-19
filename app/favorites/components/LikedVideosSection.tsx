"use client"

import { Play } from "lucide-react"
import VideoCard from "@/components/VideoCard"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { derivePosterUrl } from "@/app/favorites/utils"
import type { FavoriteVideo, OwnerProfile } from "@/app/favorites/types"

interface LikedVideosSectionProps {
  videos: FavoriteVideo[] | null
  likesLoading: boolean
  needLogin: boolean
  ownerProfiles: Record<string, OwnerProfile>
  bookmarkedSet: Set<string>
  onToggleBookmark: (video: FavoriteVideo) => void
  onVideoClick: (video: FavoriteVideo) => void
  onLoginRequest: () => void
  onExploreVideos: () => void
}

export function LikedVideosSection({
  videos,
  likesLoading,
  needLogin,
  ownerProfiles,
  bookmarkedSet,
  onToggleBookmark,
  onVideoClick,
  onLoginRequest,
  onExploreVideos,
}: LikedVideosSectionProps) {
  if (likesLoading) {
    return <div className="py-8 text-center text-gray-500">読み込み中…</div>
  }

  if (needLogin) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">ログインが必要です</h3>
        <p className="text-gray-500 mb-4">ログインして、いいねした動画を見ましょう</p>
        <button
          onClick={onLoginRequest}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
        >
          ログイン
        </button>
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">いいねした動画がありません</h3>
        <p className="text-gray-500 mb-4">気になる動画を見つけてハートを押しましょう</p>
        <button
          onClick={onExploreVideos}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
        >
          動画を見る
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {videos.map((video) => {
        const profile = ownerProfiles[video.owner_id]
        const label = profile?.username ? `@${profile.username}` : profile?.display_name || "ユーザー"
        return (
          <VideoCard
            key={video.id}
            posterUrl={derivePosterUrl(video.playback_url, (video as any).storage_path) || FALLBACK_VIDEO_URL}
            title={video.title || video.caption || "無題の動画"}
            bottomMetaVariant="account"
            accountAvatarUrl={profile?.avatar_url ?? null}
            accountLabel={label}
            accountUserId={video.owner_id}
            showTopBookmark
            isBookmarked={bookmarkedSet.has(video.id)}
            onToggleBookmark={() => onToggleBookmark(video)}
            onClickCard={() => onVideoClick(video)}
          />
        )
      })}
    </div>
  )
}
