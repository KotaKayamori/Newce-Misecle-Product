import { supabase } from "./supabase"

// Restaurant queries
export async function getRestaurants(filters?: {
  genre?: string
  distance?: number
  availableOnly?: boolean
  subscriptionDiscount?: boolean
}) {
  try {
    let query = supabase.from("restaurants").select("*").eq("available_now", true)

    if (filters?.genre) {
      query = query.eq("genre", filters.genre)
    }

    if (filters?.distance) {
      query = query.lte("distance", filters.distance)
    }

    if (filters?.availableOnly) {
      query = query.gt("available_seats", 0)
    }

    if (filters?.subscriptionDiscount) {
      query = query.eq("subscription_discount", true)
    }

    const { data, error } = await query.order("rating", { ascending: false })

    if (error) {
      // If table doesn't exist, return mock data
      if (error.message.includes("does not exist")) {
        return getMockRestaurants()
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockRestaurants()
  }
}

export async function getRestaurantById(id: number) {
  try {
    const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).single()

    if (error) {
      if (error.message.includes("does not exist")) {
        return getMockRestaurantById(id)
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockRestaurantById(id)
  }
}

// Mock data functions
function getMockRestaurants() {
  return [
    {
      id: 1,
      name: "カフェ・ド・パリ",
      genre: "フレンチ",
      distance: 0.2,
      available_seats: 3,
      rating: 4.5,
      price_range: "¥2,000-3,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "寿司 銀座",
      genre: "和食",
      distance: 0.5,
      available_seats: 2,
      rating: 4.8,
      price_range: "¥5,000-8,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: "イタリアン・ビストロ",
      genre: "イタリアン",
      distance: 0.8,
      available_seats: 5,
      rating: 4.3,
      price_range: "¥3,000-4,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      name: "焼肉 炭火亭",
      genre: "焼肉",
      distance: 0.3,
      available_seats: 4,
      rating: 4.6,
      price_range: "¥3,000-4,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      name: "パスタ・ハウス",
      genre: "イタリアン",
      distance: 0.7,
      available_seats: 2,
      rating: 4.2,
      price_range: "¥2,000-3,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      name: "天ぷら 季節",
      genre: "和食",
      distance: 1.2,
      available_seats: 1,
      rating: 4.7,
      price_range: "¥4,000-6,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 7,
      name: "炭火焼き鳥 とり源",
      genre: "焼肉",
      distance: 0.3,
      available_seats: 3,
      rating: 4.6,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 8,
      name: "カフェ ひだまり",
      genre: "カフェ",
      distance: 0.5,
      available_seats: 4,
      rating: 4.2,
      price_range: "¥1,000-2,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 9,
      name: "ラーメン 龍神",
      genre: "ラーメン",
      distance: 0.8,
      available_seats: 2,
      rating: 4.7,
      price_range: "¥800-1,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 10,
      name: "寿司処 海鮮",
      genre: "和食",
      distance: 0.6,
      available_seats: 1,
      rating: 4.8,
      price_range: "¥4,000-6,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 11,
      name: "ピザハウス マルゲリータ",
      genre: "イタリアン",
      distance: 0.9,
      available_seats: 3,
      rating: 4.4,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 12,
      name: "韓国料理 ソウル",
      genre: "韓国料理",
      distance: 1.1,
      available_seats: 2,
      rating: 4.3,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 13,
      name: "天ぷら 江戸前",
      genre: "和食",
      distance: 0.7,
      available_seats: 2,
      rating: 4.5,
      price_range: "¥3,500-5,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 14,
      name: "ハンバーガー ビッグバイト",
      genre: "洋食",
      distance: 0.4,
      available_seats: 5,
      rating: 4.1,
      price_range: "¥1,500-2,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 15,
      name: "イタリアン Trattoria Sole",
      genre: "イタリアン",
      distance: 0.4,
      available_seats: 3,
      rating: 4.3,
      price_range: "¥3,000-4,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 16,
      name: "寿司 小町",
      genre: "和食",
      distance: 0.6,
      available_seats: 1,
      rating: 4.8,
      price_range: "¥5,000-8,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 17,
      name: "ベトナム料理 サイゴン",
      genre: "エスニック",
      distance: 1.2,
      available_seats: 4,
      rating: 4.1,
      price_range: "¥2,000-3,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 18,
      name: "フレンチ ル・ボヌール",
      genre: "フレンチ",
      distance: 1.5,
      available_seats: 2,
      rating: 4.7,
      price_range: "¥8,000-12,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 19,
      name: "中華料理 北京飯店",
      genre: "中華",
      distance: 0.8,
      available_seats: 3,
      rating: 4.4,
      price_range: "¥2,000-3,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 20,
      name: "タイ料理 バンコクキッチン",
      genre: "エスニック",
      distance: 1.0,
      available_seats: 2,
      rating: 4.2,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 21,
      name: "ステーキハウス プライム",
      genre: "洋食",
      distance: 1.3,
      available_seats: 1,
      rating: 4.6,
      price_range: "¥5,000-8,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 22,
      name: "居酒屋 大漁",
      genre: "居酒屋",
      distance: 0.5,
      available_seats: 4,
      rating: 4.3,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 23,
      name: "カレーハウス スパイス",
      genre: "カレー",
      distance: 0.9,
      available_seats: 3,
      rating: 4.0,
      price_range: "¥1,200-2,000",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 24,
      name: "蕎麦処 手打ち庵",
      genre: "和食",
      distance: 1.1,
      available_seats: 2,
      rating: 4.5,
      price_range: "¥1,500-2,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: false,
      available_now: true,
      created_at: new Date().toISOString(),
    },
  ]
}

function getMockRestaurantById(id: number) {
  const restaurants = getMockRestaurants()
  const restaurant = restaurants.find((r) => r.id === id)

  if (!restaurant) {
    return {
      id,
      name: "炭火焼き鳥 とり源",
      genre: "焼肉",
      distance: 0.3,
      available_seats: 3,
      rating: 4.6,
      price_range: "¥2,500-3,500",
      image_url: "/placeholder.svg?height=120&width=120",
      subscription_discount: true,
      available_now: true,
      created_at: new Date().toISOString(),
      address: "東京都渋谷区渋谷1-2-3 渋谷ビル2F",
      phone: "03-1234-5678",
      hours: "17:00-24:00（L.O.23:30）",
      closedDays: "日曜日",
      crowdLevel: "普通",
      reviewCount: 128,
      images: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
      ],
      description:
        "炭火で丁寧に焼き上げる絶品焼き鳥が自慢の居酒屋です。新鮮な国産鶏を使用し、秘伝のタレで味付けした焼き鳥は絶品です。",
    }
  }

  return {
    ...restaurant,
    address: "東京都渋谷区渋谷1-2-3 渋谷ビル2F",
    phone: "03-1234-5678",
    hours: "17:00-24:00（L.O.23:30）",
    closedDays: "日曜日",
    crowdLevel: "普通",
    reviewCount: 128,
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    description:
      "炭火で丁寧に焼き上げる絶品焼き鳥が自慢の居酒屋です。新鮮な国産鶏を使用し、秘伝のタレで味付けした焼き鳥は絶品です。",
  }
}

// Reservation queries
export async function getUserReservations(userId: string) {
  try {
    // First try to query with the relationship
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        restaurants (
          id,
          name,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // If there's a relationship error or table doesn't exist, return mock data
      console.error("Database error, using mock data:", error)
      return getMockReservations()
    }

    return data || []
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockReservations()
  }
}

function getMockReservations() {
  return [
    {
      id: 1,
      restaurantName: "カフェ・ド・パリ",
      date: "2024年1月15日",
      time: "19:00",
      people: 2,
      status: "仮押さえ中",
      expiresIn: "15分",
      image: "/placeholder.svg?height=60&width=80",
    },
    {
      id: 2,
      restaurantName: "焼肉 炭火亭",
      date: "2024年1月18日",
      time: "18:30",
      people: 4,
      status: "仮押さえ中",
      expiresIn: "8分",
      image: "/placeholder.svg?height=60&width=80",
    },
    {
      id: 3,
      restaurantName: "寿司 銀座",
      date: "2024年1月20日",
      time: "18:30",
      people: 4,
      status: "予約確定",
      image: "/placeholder.svg?height=60&width=80",
    },
    {
      id: 4,
      restaurantName: "パスタ・ハウス",
      date: "2023年12月28日",
      time: "20:00",
      people: 2,
      status: "来店済み",
      image: "/placeholder.svg?height=60&width=80",
    },
    {
      id: 5,
      restaurantName: "天ぷら 季節",
      date: "2023年12月20日",
      time: "19:30",
      people: 3,
      status: "キャンセル済み",
      image: "/placeholder.svg?height=60&width=80",
    },
  ]
}

export async function createReservation(reservation: {
  user_id: string
  restaurant_id: number
  date: string
  time: string
  people: number
  status?: "hold" | "confirmed"
}) {
  try {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15分後に期限切れ

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        ...reservation,
        status: reservation.status || "hold",
        expires_at: reservation.status === "hold" ? expiresAt.toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes("does not exist")) {
        // Return mock success response
        return {
          id: Math.floor(Math.random() * 1000),
          ...reservation,
          status: reservation.status || "hold",
          expires_at: reservation.status === "hold" ? expiresAt.toISOString() : null,
          created_at: new Date().toISOString(),
        }
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return {
      id: Math.floor(Math.random() * 1000),
      ...reservation,
      status: reservation.status || "hold",
      expires_at: reservation.status === "hold" ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
    }
  }
}

export async function updateReservationStatus(id: number, status: "confirmed" | "cancelled") {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .update({
        status,
        expires_at: status === "confirmed" ? null : undefined,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.message.includes("does not exist")) {
        return { id, status, updated_at: new Date().toISOString() }
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return { id, status, updated_at: new Date().toISOString() }
  }
}

export async function cancelReservation(id: number) {
  return updateReservationStatus(id, "cancelled")
}

export async function confirmReservation(id: number) {
  return updateReservationStatus(id, "confirmed")
}

// Comment/Review queries
export async function getRestaurantComments(restaurantId: number) {
  try {
    const { data, error } = await supabase
      .from("restaurant_comments")
      .select(`
        *,
        user_profiles (
          name
        ),
        restaurants (
          name
        )
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error, using mock data:", error)
      return getMockComments()
    }

    return data || []
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockComments()
  }
}

export async function getUserComments(userId: string) {
  try {
    const { data, error } = await supabase
      .from("restaurant_comments")
      .select(`
        *,
        restaurants (
          id,
          name,
          image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error, using mock data:", error)
      return getMockUserComments()
    }

    return data || []
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockUserComments()
  }
}

function getMockComments() {
  return [
    {
      id: 1,
      rating: 4.5,
      comment: "雰囲気が良く、料理も美味しかったです。特にデザートが絶品でした！",
      created_at: "2024年1月10日",
      user_profiles: { name: "田中太郎" },
    },
    {
      id: 2,
      rating: 4.8,
      comment: "お肉の質が素晴らしく、サービスも丁寧でした。",
      created_at: "2024年1月8日",
      user_profiles: { name: "佐藤花子" },
    },
  ]
}

function getMockUserComments() {
  return [
    {
      id: 1,
      restaurantName: "カフェ・ド・パリ",
      visitDate: "2024年1月10日",
      userComment: "雰囲気が良く、料理も美味しかったです。特にデザートが絶品でした！",
      restaurantReply:
        "ご来店ありがとうございました！デザートを気に入っていただけて嬉しいです。またのお越しをお待ちしております。",
      reactions: [
        { type: "heart", count: 3 },
        { type: "thumbsup", count: 1 },
      ],
      image: "/placeholder.svg?height=60&width=80",
      rating: 4.5,
      replied: true,
    },
    {
      id: 2,
      restaurantName: "焼肉 炭火亭",
      visitDate: "2024年1月5日",
      userComment: "お肉の質が素晴らしく、サービスも丁寧でした。",
      restaurantReply: null,
      reactions: [{ type: "heart", count: 2 }],
      image: "/placeholder.svg?height=60&width=80",
      rating: 4.8,
      replied: false,
    },
  ]
}

export async function createComment(comment: {
  user_id: string
  restaurant_id: number
  rating: number
  comment: string
}) {
  try {
    const { data, error } = await supabase.from("restaurant_comments").insert(comment).select().single()

    if (error) {
      console.error("Database error, using mock response:", error)
      return {
        id: Math.floor(Math.random() * 1000),
        ...comment,
        created_at: new Date().toISOString(),
      }
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return {
      id: Math.floor(Math.random() * 1000),
      ...comment,
      created_at: new Date().toISOString(),
    }
  }
}

// Notification queries
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error, using mock data:", error)
      return getMockNotifications()
    }

    return data || []
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockNotifications()
  }
}

function getMockNotifications() {
  return [
    {
      id: 1,
      type: "reservation",
      title: "予約確認のお知らせ",
      message: "寿司 銀座での予約が確定しました。1月20日 18:30〜",
      time: "2時間前",
      read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      type: "promotion",
      title: "会員限定特典",
      message: "今週末限定！対象店舗で20%オフクーポンをプレゼント",
      time: "1日前",
      read: false,
      created_at: new Date().toISOString(),
    },
  ]
}

export async function createNotification(notification: {
  user_id: string
  type: "reservation" | "promotion" | "alert" | "system"
  title: string
  message: string
}) {
  try {
    const { data, error } = await supabase.from("notifications").insert(notification).select().single()

    if (error) {
      console.error("Database error, using mock response:", error)
      return {
        id: Math.floor(Math.random() * 1000),
        ...notification,
        read: false,
        created_at: new Date().toISOString(),
      }
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return {
      id: Math.floor(Math.random() * 1000),
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
    }
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    const { data, error } = await supabase.from("notifications").update({ read: true }).eq("id", id).select().single()

    if (error) {
      console.error("Database error, using mock response:", error)
      return { id, read: true, updated_at: new Date().toISOString() }
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return { id, read: true, updated_at: new Date().toISOString() }
  }
}

// User profile queries
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Database error, using mock data:", error)
      return getMockUserProfile()
    }

    return data
  } catch (error) {
    console.error("Database error, using mock data:", error)
    return getMockUserProfile()
  }
}

function getMockUserProfile() {
  return {
    id: "mock-user-id",
    name: "田中太郎",
    subscription_plan: "premium",
    subscription_expires_at: "2024-12-31T23:59:59Z",
    created_at: new Date().toISOString(),
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string
    subscription_plan?: "basic" | "premium"
    subscription_expires_at?: string
  },
) {
  try {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("Database error, using mock response:", error)
      return { ...getMockUserProfile(), ...updates, updated_at: new Date().toISOString() }
    }

    return data
  } catch (error) {
    console.error("Database error, using mock response:", error)
    return { ...getMockUserProfile(), ...updates, updated_at: new Date().toISOString() }
  }
}

// Statistics queries
export async function getUserStats(userId: string) {
  try {
    // Get total applications (reservations)
    const { count: totalApplications } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get average rating given by user
    const { data: ratings } = await supabase.from("restaurant_comments").select("rating").eq("user_id", userId)

    const averageRating =
      ratings && ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

    // Get total reviews
    const { count: totalReviews } = await supabase
      .from("restaurant_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    return {
      totalApplications: totalApplications || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews || 0,
    }
  } catch (error) {
    console.error("Database error, using mock stats:", error)
    return {
      totalApplications: 24,
      averageRating: 4.6,
      totalReviews: 12,
    }
  }
}
