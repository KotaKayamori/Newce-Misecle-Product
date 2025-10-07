import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
