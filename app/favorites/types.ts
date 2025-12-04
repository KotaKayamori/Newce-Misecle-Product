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

export interface SelectedRestaurant {
  id: string
  restaurantName: string
  restaurantEmail?: string
  rating?: string | number
  genre?: string
  distance?: string
  caption?: string
  [key: string]: any
  ownerLabel?: string | null
  ownerAvatarUrl?: string | null
  stores?: { name: string; tel: string | null }[]
}
