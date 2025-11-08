"use client"

import VideoCard from "@/components/VideoCard"
import { derivePosterUrl } from "@/app/search/utils"
import type { OwnerProfile, SupabaseVideoRow } from "../types"
import type { MutableRefObject } from "react"

interface LatestVideosSectionProps {
  visible: boolean
  categoryLabel: string
  videos: SupabaseVideoRow[]
  ownerProfiles: Record<string, OwnerProfile>
  bookmarkedVideoIds: Set<string>
  playersRef: MutableRefObject<Record<string, HTMLVideoElement | null>>
  onVideoSelect: (video: SupabaseVideoRow) => void
  onToggleFavorite: (id: string | number, e?: React.MouseEvent) => void
  onOpenUserProfile: (payload: { id: string; name: string | null; avatar?: string | null; isFollowing: boolean }) => void
}

export function LatestVideosSection({
  visible,
  categoryLabel,
  videos,
  ownerProfiles,
  bookmarkedVideoIds,
  playersRef,
  onVideoSelect,
  onToggleFavorite,
  onOpenUserProfile,
}: LatestVideosSectionProps) {
  if (!visible) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{categoryLabel}</h2>
        <span className="text-sm text-gray-600">{videos.length}件</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {videos.map((video) => {
          const ownerProfile = video.owner_id ? ownerProfiles[video.owner_id] : undefined
          const ownerHandle = ownerProfile?.username
            ? `@${ownerProfile.username}`
            : ownerProfile?.display_name || "ユーザー"
          const ownerAvatarUrl = ownerProfile?.avatar_url ?? null
          const ownerDisplayName = ownerProfile?.display_name || ownerHandle
          const isBookmarked = bookmarkedVideoIds.has(video.id)

          return (
            <VideoCard
              key={video.id}
              posterUrl={derivePosterUrl(video.playback_url, video.storage_path) || "/placeholder.jpg"}
              title={video.title || video.caption || "動画"}
              cardAriaLabel={`動画を全画面で表示（${video.title || "動画"}）`}
              cardTitleAttribute="動画を全画面で表示"
              videoSrc={video.playback_url}
              videoRef={(el) => {
                playersRef.current[video.id] = el
              }}
              onClickCard={() => onVideoSelect(video)}
              showTopBookmark
              isBookmarked={isBookmarked}
              onToggleBookmark={(e) => onToggleFavorite(video.id, e)}
              bottomMetaVariant="account"
              accountAvatarUrl={ownerAvatarUrl}
              accountLabel={ownerHandle}
              onBottomClick={() =>
                onOpenUserProfile({
                  id: video.id,
                  name: ownerDisplayName,
                  avatar: ownerAvatarUrl,
                  isFollowing: isBookmarked,
                })
              }
            />
          )
        })}
      </div>
    </div>
  )
}

