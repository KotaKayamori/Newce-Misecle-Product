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
  store_1_name?: string | null
  store_1_tel?: string | null
  store_1_tabelog?: string | null
  store_2_name?: string | null
  store_2_tel?: string | null
  store_2_tabelog?: string | null
  store_3_name?: string | null
  store_3_tel?: string | null
  store_3_tabelog?: string | null
}

// アルバムアイテムの型
export type AlbumItem = {
  id: string
  title?: string | null
  description?: string | null
  coverUrl?: string | null
  createdAt?: string | null
  owner?: {
    id: string
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
  ownerLabel?: string | null
  ownerAvatarUrl?: string | null
  stores?: { name: string; tel: string | null; tabelog?: string | null }[]
}

export interface FavoriteVideo {
  id: string
  owner_id: string
  playback_url: string
  title?: string | null
  caption?: string | null
  created_at?: string
  [key: string]: any
}

export interface BookmarkedVideo {
  id: string
  created_at: string
  videos: FavoriteVideo & { categories?: string[] | null }
}

export interface AlbumRow {
  id: string
  owner_id: string
  title: string | null
  caption: string | null
  cover_path: string | null
  created_at: string
}

export interface OwnerProfile {
  id: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

export interface ReservationFormData {
  name: string
  people: number
  date: string
  time: string
  seatType: string
  message: string
}

export type SearchResults = {
  videos: SupabaseVideoRow[]
  albums: AlbumItem[]
}