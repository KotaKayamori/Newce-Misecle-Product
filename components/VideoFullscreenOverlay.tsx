"use client"

import FullscreenMediaPlayer from "@/components/player/FullscreenMediaPlayer"

export interface FullscreenVideoData {
  id: string
  playback_url: string
  poster_url?: string | null
  title?: string | null
  caption?: string | null
}

interface VideoFullscreenOverlayProps {
  open: boolean
  video: FullscreenVideoData
  ownerHandle: string
  ownerAvatarUrl?: string | null
  liked: boolean
  likeCount?: number
  onToggleLike: () => void
  bookmarked: boolean
  onToggleBookmark: () => void
  onShare: () => Promise<void> | void
  onClose: () => void
  onReserve: () => void
  onMore: () => void
  muted: boolean
  onToggleMuted: () => void
}

export default function VideoFullscreenOverlay(props: VideoFullscreenOverlayProps) {
  const {
    open,
    video,
    ownerHandle,
    ownerAvatarUrl,
    liked,
    likeCount = 0,
    onToggleLike,
    bookmarked,
    onToggleBookmark,
    onShare,
    onClose,
    onReserve,
    onMore,
    muted,
    onToggleMuted,
  } = props

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <FullscreenMediaPlayer
        open={open}
        active
        post={{
          id: video.id,
          videoUrl: video.playback_url,
          posterUrl: video.poster_url,
          title: video.title,
          caption: video.caption,
        }}
        ownerHandle={ownerHandle}
        ownerAvatarUrl={ownerAvatarUrl}
        liked={liked}
        likeCount={likeCount}
        bookmarked={bookmarked}
        onToggleLike={onToggleLike}
        onToggleBookmark={onToggleBookmark}
        onShare={onShare}
        onClose={onClose}
        onReserve={onReserve}
        onMore={onMore}
        muted={muted}
        onToggleMuted={onToggleMuted}
      />
    </div>
  )
}

