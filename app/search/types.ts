/**
 * 検索ページで使用する型定義
 */

// Supabaseから取得する動画データの型
export type SupabaseVideoRow = {
  id: string
  owner_id: string | null
  playback_url: string
  storage_path: string | null
  title: string | null
  caption: string | null
  created_at: string
  video_likes?: { count?: number }[]
}

// アルバムアイテムの型
export type AlbumItem = {
  id: string
  title?: string | null
  description?: string | null
  coverUrl?: string | null
  createdAt?: string | null
  owner?: {
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
  } | null
}

// アルバム内のアセット（画像）の型
export type AssetItem = {
  id: string
  url: string
  order: number
  width?: number | null
  height?: number | null
}

// フィルターオプションの型
export type FilterOptions = Record<string, string[]>

// ユーザープロフィールの型
export type UserProfile = {
  id: string
  name: string
  avatar?: string | null
  isFollowing?: boolean
}

// レストラン情報の型
export type RestaurantInfo = {
  id: string
  restaurantName: string
  restaurantEmail: string
  genre: string
  distance: string
  rating: number
  caption?: string
}

// オーナープロフィールの型
export type OwnerProfile = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

