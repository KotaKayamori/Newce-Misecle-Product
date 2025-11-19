import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")

    // カテゴリフィルタリング（表示名 -> 内部コード）
    const categoryMap: Record<string, string> = {
      "今日のおすすめ": "today_recommended",
      "今人気のお店": "popular_now",
      "SNSで人気のお店": "sns_pupular",
      "Z世代に人気のお店": "gen_z_popular",
      "デートにおすすめのお店": "date_recommended",
    }
    const knownCodes = new Set(Object.values(categoryMap))
    const resolveCategoryCode = (input?: string | null) => {
      if (!input) return null
      if (knownCodes.has(input)) return input
      return categoryMap[input] ?? null
    }
    const dbCategoryCode: string | null = resolveCategoryCode(category)

    // RPCは text[] 受け取り想定。単一カテゴリでも配列化して渡す
    let rpcQuery = supabase.rpc("get_random_videos", {
      video_limit: limit,
      category_filter: dbCategoryCode ? [dbCategoryCode] : [],
    })

    const { data: videos, error } = await rpcQuery

    if (error) {
      console.error("Videos fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
    }

    // 動画データ型定義
    interface Video {
      id: string
      title: string
      category?: string | null
      categories?: string[]
      public_url?: string | null
      playback_url?: string | null
      caption?: string | null
      influencer_comment?: string | null
      store_info?: unknown
      tel?: string | null
      created_at: string
      user_profiles?: UserProfile[] | UserProfile | null
    }

    interface UserProfile {
      id: string
      name: string
      username: string
      avatar_url: string
    }

    // データ形式を整形（categories に対応しつつ、互換のため category も先頭要素で返す）
    const formattedVideos =
      (videos as Video[])?.map((video: Video) => {
        const profile = Array.isArray(video.user_profiles) ? video.user_profiles[0] : video.user_profiles

        // DB側が categories または category を返すケースの両対応
        const categories: string[] =
          Array.isArray(video.categories)
            ? video.categories
            : (video.category ? [video.category] : [])

        return {
          id: video.id,
          title: video.title,
          // 互換用: 先頭カテゴリを category として残す
          category: categories[0] ?? null,
          // 新: 複数カテゴリを返す
          categories,
          public_url: video.public_url ?? video.playback_url ?? null,
          playback_url: video.playback_url ?? video.public_url ?? null,
          caption: video.caption ?? video.influencer_comment ?? null,
          store_info: video.store_info ?? null,
          tel: video.tel ?? null,
          created_at: video.created_at,
          // 常にオブジェクトで返す（nullを避ける）
          user: {
            id: profile?.id ?? "",
            name: profile?.name ?? "",
            username: profile?.username ?? "",
            avatar_url: profile?.avatar_url ?? "",
          },
        }
      }) || []

    return NextResponse.json({
      videos: formattedVideos,
      count: formattedVideos.length,
    })
  } catch (error) {
    console.error("Random videos API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
