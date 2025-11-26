// Shared helpers for opening store detail / reservation from video contexts
// Keep logic identical between Search and Favorites

export type BasicVideo = {
  id: string
  title?: string | null
  category?: string | null
  caption?: string | null
  store_info?: unknown
  store_1_name?: string | null
  store_1_tel?: string | null
  store_2_name?: string | null
  store_2_tel?: string | null
  store_3_name?: string | null
  store_3_tel?: string | null
}

export function normalizeOptionalText(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function mapVideoToRestaurant(video: BasicVideo | null | undefined) {
  if (!video) return null
  const stores = [1, 2, 3]
    .map((index) => {
      const name = normalizeOptionalText((video as any)[`store_${index}_name`])
      const tel = normalizeOptionalText((video as any)[`store_${index}_tel`])
      if (!name && !tel) return null
      return { name: name ?? "店舗情報", tel: tel ?? null }
    })
    .filter(Boolean) as { name: string; tel: string | null }[]

  const primaryStore = stores.length > 0 ? stores[0] : null

  const fallbackTitle = (video.title || "おすすめ動画").toString().trim() || "おすすめ動画"
  const title = primaryStore?.name || fallbackTitle
  const caption =
    normalizeOptionalText(video.caption) ||
    normalizeOptionalText((video as any)?.captionText) ||
    normalizeOptionalText((video as any)?.influencer_comment)

  const extractedTel: string | null = primaryStore?.tel ?? null
  const ownerLabel =
    (video as any)?.owner_label ??
    (video as any)?.ownerLabel ??
    undefined
  const ownerAvatarUrl = (video as any)?.owner_avatar_url ?? (video as any)?.ownerAvatarUrl ?? null

  return {
    id: video.id,
    restaurantName: title,
    restaurantEmail: `info@${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"}.example.com`,
    genre: (video.category as any) || "おすすめ",
    distance: "—",
    rating: 0,
    caption,
    ownerLabel: ownerLabel ?? null,
    ownerAvatarUrl,
    stores: stores.length > 0 ? stores : undefined,
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
  ctx.setSelectedRestaurant(mapped)
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
