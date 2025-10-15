import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')

    // let query = supabase
    //   .from('videos')
    //   .select(`
    //     id,
    //     title,
    //     category,
    //     public_url,
    //     store_info,
    //     influencer_comment,
    //     created_at,
    //     user_id,
    //     user_profiles!inner (
    //       id,
    //       name,
    //       username,
    //       avatar_url
    //     )
    //   `)

    // カテゴリフィルタリング
    let dbCategory = null
    if (category && category !== '今日のおすすめ') {
      const categoryMap: Record<string, string> = {
        '今人気のお店': 'popular_now',
        'SNSで人気のお店': 'sns_popular',
        'Z世代に人気のお店': 'gen_z_popular',
        'デートにおすすめのお店': 'date_recommended'
      }
      dbCategory = categoryMap[category]
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

    // データ形式を整形
    const formattedVideos = videos?.map(video => {
      // user_profiles comes back as an array (due to the join); pick the first profile, or handle when it's already an object
      const profile = Array.isArray(video.user_profiles) ? video.user_profiles[0] : video.user_profiles

      return {
        id: video.id,
        title: video.title,
        category: video.category,
        public_url: video.public_url,
        store_info: video.store_info,
        influencer_comment: video.influencer_comment,
        created_at: video.created_at,
        user: profile ? {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          avatar_url: profile.avatar_url
        } : null
      }
    }) || []

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