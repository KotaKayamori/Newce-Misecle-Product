// Shared helpers for opening store detail / reservation from video contexts
// Keep logic identical between Search and Favorites

export type BasicVideo = {
  id: string
  title?: string | null
  category?: string | null
  caption?: string | null
}

export function normalizeOptionalText(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function mapVideoToRestaurant(video: BasicVideo | null | undefined) {
  if (!video) return null
  const title = (video.title || "おすすめ動画").toString().trim() || "おすすめ動画"
  return {
    id: video.id,
    restaurantName: title,
    restaurantEmail: `info@${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"}.example.com`,
    genre: (video.category as any) || "おすすめ",
    distance: "—",
    rating: 0,
  }
}

type StoreDetailCtx = {
  setSelectedRestaurant: (r: any) => void
  setShowStoreDetailModal: (b: boolean) => void
  setShowFullscreenVideo?: (b: boolean) => void
}

export function openStoreDetailForVideo(
  ctx: StoreDetailCtx,
  video: BasicVideo | (BasicVideo & Record<string, any>) | null,
  options?: { keepFullscreen?: boolean }
) {
  const mapped = mapVideoToRestaurant(video)
  if (!mapped) return
  const normalizedCaption =
    normalizeOptionalText((video as any)?.caption) ||
    normalizeOptionalText((video as any)?.influencer_comment) ||
    normalizeOptionalText((video as any)?.captionText)

  ctx.setSelectedRestaurant({ ...mapped, caption: normalizedCaption })
  ctx.setShowStoreDetailModal(true)
  if (!options?.keepFullscreen && ctx.setShowFullscreenVideo) ctx.setShowFullscreenVideo(false)
}

type ReserveCtx = {
  setSelectedRestaurant: (r: any) => void
  setShowReservationModal: (b: boolean) => void
  setShowFullscreenVideo?: (b: boolean) => void
}

export function openReservationForVideo(
  ctx: ReserveCtx,
  video: BasicVideo | null,
  options?: { keepFullscreen?: boolean }
) {
  const mapped = mapVideoToRestaurant(video)
  if (!mapped) return
  ctx.setSelectedRestaurant(mapped)
  ctx.setShowReservationModal(true)
  // デフォルトはフルスクリーンを維持。必要な場合のみ明示的に閉じる
  if (options?.keepFullscreen === false && ctx.setShowFullscreenVideo) ctx.setShowFullscreenVideo(false)
}


