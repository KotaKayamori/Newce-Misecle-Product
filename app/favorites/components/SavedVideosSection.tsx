"use client"

import { Play } from "lucide-react"
import VideoCard from "@/components/VideoCard"
import { FALLBACK_VIDEO_URL } from "@/lib/media"
import { derivePosterUrl } from "@/app/favorites/utils"
import type { BookmarkedVideo, FavoriteVideo, OwnerProfile } from "@/app/favorites/types"

interface SavedVideosSectionProps {
  videos: BookmarkedVideo[]
  loading: boolean
  error: string | null
  needLogin: boolean
  ownerProfiles: Record<string, OwnerProfile>
  onLoginRequest: () => void
  onExploreVideos: () => void
  onRemoveBookmark: (videoId: string) => void
  onVideoClick: (video: FavoriteVideo) => void
}

export function SavedVideosSection({
  videos,
  loading,
  error,
  needLogin,
  ownerProfiles,
  onLoginRequest,
  onExploreVideos,
  onRemoveBookmark,
  onVideoClick,
}: SavedVideosSectionProps) {
  if (loading) {
    return <div className="py-8 text-center text-gray-500">読み込み中…</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-700 underline">
          再試行
        </button>
      </div>
    )
  }

  if (needLogin) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">ログインが必要です</h3>
        <p className="text-gray-500 mb-4">ログインして、保存した動画を見ましょう</p>
        <button
          onClick={onLoginRequest}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
        >
          ログイン
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">保存した動画がありません</h3>
        <p className="text-gray-500 mb-4">気になる動画を見つけてブックマークしましょう</p>
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
      {videos.map((bookmark) => {
        const video = bookmark.videos
        const profile = ownerProfiles[video.owner_id]
        const label = profile?.username ? `@${profile.username}` : profile?.display_name || "ユーザー"
        return (
          <VideoCard
            key={bookmark.id}
            posterUrl={derivePosterUrl(video.playback_url, (video as any).storage_path) || FALLBACK_VIDEO_URL}
            title={video.title || video.caption || "無題の動画"}
            showTopBookmark
            isBookmarked
            onToggleBookmark={() => onRemoveBookmark(video.id)}
            bottomMetaVariant="account"
            accountAvatarUrl={profile?.avatar_url ?? null}
            accountLabel={label}
            accountUserId={video.owner_id}
            onClickCard={() => onVideoClick(video)}
          />
        )
      })}
    </div>
  )
}
