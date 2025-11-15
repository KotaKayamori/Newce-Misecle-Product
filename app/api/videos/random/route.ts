import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const CATEGORY_SLUG_MAP: Record<string, string> = {
  "今日のおすすめ": "today_recommended",
  "今人気のお店": "popular_now",
  "SNSで人気のお店": "sns_pupular",
  "Z世代に人気のお店": "gen_z_popular",
  "デートにおすすめのお店": "date_recommended",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const category = searchParams.get("category")

    let dbCategory: string | null = null
    if (category && category !== "最新動画") {
      dbCategory = CATEGORY_SLUG_MAP[category] ?? null
    }

    // RPC関数を使用してランダム取得
    let rpcQuery = supabase.rpc('get_random_videos', {
      video_limit: limit,
      category_filter: dbCategory
    })

    const { data: videos, error } = await rpcQuery

    // ランダムに取得（PostgreSQLのrandom()関数を使用）
    // const { data: videos, error } = await query
    //   .order('random()', { ascending: true })
    //   .limit(limit)

    if (error) {
      console.error('Videos fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch videos' 
      }, { status: 500 })
    }

    const formattedVideos =
      videos?.map((video) => {
        const profile = Array.isArray(video.user_profiles) ? video.user_profiles[0] : video.user_profiles

        return {
          id: video.id,
          title: video.title,
          category: video.category,
          public_url: video.public_url ?? video.playback_url,
          playback_url: video.playback_url ?? video.public_url,
          caption: video.caption ?? video.influencer_comment ?? null,
          store_info: video.store_info ?? null,
          tel: video.tel ?? null,
          created_at: video.created_at,
          user: profile
            ? {
                id: profile.id,
                name: profile.name,
                username: profile.username,
                avatar_url: profile.avatar_url,
              }
            : null,
        }
      }) ?? []

    return NextResponse.json({ 
      videos: formattedVideos,
      count: formattedVideos.length
    })

  } catch (error) {
    console.error('Random videos API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
