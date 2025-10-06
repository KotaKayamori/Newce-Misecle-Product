import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Prevent hard crash in local/dev without env vars
  // The app will use mock data paths when requests fail.
  console.warn(
    "[Misecle] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Using placeholder keys; features requiring Supabase may not work. Configure .env.local to remove this warning.",
  )
}

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "public-anon-key",
)

// Database types
export type Restaurant = {
  id: number
  name: string
  genre: string
  distance: number
  available_seats: number
  rating: number
  price_range: string
  image_url: string
  subscription_discount: boolean
  available_now: boolean
  created_at: string
}

export type Reservation = {
  id: number
  user_id: string
  restaurant_id: number
  date: string
  time: string
  people: number
  status: "hold" | "confirmed" | "cancelled"
  expires_at?: string
  created_at: string
}

export type Notification = {
  id: number
  user_id: string
  type: "reservation" | "promotion" | "alert" | "system"
  title: string
  message: string
  read: boolean
  created_at: string
}

export type User = {
  id: string
  email: string
  name: string
  subscription_plan: "basic" | "premium" | null
  subscription_expires_at?: string
  created_at: string
}
