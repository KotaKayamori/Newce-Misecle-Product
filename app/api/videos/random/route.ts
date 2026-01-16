import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')

    // カテゴリフィルタリング
    const categoryMap: Record<string, string> = {
      'あなたにおすすめ': 'today_recommended',
      '人気急上昇中': 'popular_now',
      'SNSで人気': 'sns_popular',
      '若年層に人気': 'gen_z_popular',
      'デートにおすすめ': 'date_recommended'
    }
    const knownSlugs = new Set(Object.values(categoryMap))
    const resolveCategorySlug = (value?: string | null) => {
      if (!value) return null
      if (knownSlugs.has(value)) return value
      return categoryMap[value] ?? null
    }
    const dbCategorySlug = resolveCategorySlug(category)

    // RPC関数を使用してランダム取得
    let rpcQuery = supabase.rpc('get_random_videos', {
      video_limit: limit,
      category_filter: dbCategorySlug ? [dbCategorySlug] : []
    })

    const { data: videos, error } = await rpcQuery

    if (error) {
      console.error('Videos fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch videos' 
      }, { status: 500 })
    }

    const ownerIds = Array.from(
      new Set(
        (videos ?? [])
          .map((video: any) => video.owner_id)
          .filter((id: string | null | undefined): id is string => Boolean(id))
      )
    )

    let ownerProfiles: Record<string, { id?: string; username?: string | null; display_name?: string | null; name?: string | null; avatar_url?: string | null }> = {}
    if (ownerIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, username, display_name, name, avatar_url")
        .in("id", ownerIds)
      if (!profileError && profileRows) {
        ownerProfiles = Object.fromEntries(profileRows.map((row) => [row.id, row]))
      }
    }

    // データ形式を整形
    interface UserProfile {
      id?: string;
      username?: string | null;
      display_name?: string | null;
      name?: string | null;
      profile?: string | null;
      avatar_url?: string | null;
    }

    interface Video {
      id: string;
      owner_id?: string | null;
      title: string;
      categories: string[];
      public_url?: string | null;
      playback_url?: string | null;
      caption?: string | null;
      influencer_comment?: string | null;
      store_info?: any;
      store_1_name?: string | null;
      store_1_tel?: string | null;
      store_2_name?: string | null;
      store_2_tel?: string | null;
      store_3_name?: string | null;
      store_3_tel?: string | null;
      created_at: string;
      user_profiles?: UserProfile[] | UserProfile | null;
    }

    interface FormattedVideo {
      id: string;
      owner_id: string | null;
      title: string;
      categories: string[];
      public_url?: string | null;
      playback_url?: string | null;
      caption: string | null;
      store_info: any;
      store_1_name: string | null;
      store_1_tel: string | null;
      store_2_name: string | null;
      store_2_tel: string | null;
      store_3_name: string | null;
      store_3_tel: string | null;
      created_at: string;
      user: {
      id: string | null;
      name: string | null;
      username: string | null;
      avatar_url: string | null;
      };
    }

    const formattedVideos: FormattedVideo[] = (videos as Video[] | undefined)?.map((video: Video) => {
      const profileFromRpc = Array.isArray(video.user_profiles) ? video.user_profiles[0] : video.user_profiles;
      const ownerProfile: UserProfile | null =
      ownerProfiles[video.owner_id as string] ?? profileFromRpc ?? null;

      return {
      id: video.id,
      owner_id: video.owner_id ?? null,
      title: video.title,
      categories: video.categories ?? [],
      public_url: video.public_url ?? video.playback_url,
      playback_url: video.playback_url ?? video.public_url,
      caption: video.caption ?? video.influencer_comment ?? null,
      store_info: video.store_info ?? null,
      store_1_name: video.store_1_name ?? null,
      store_1_tel: video.store_1_tel ?? null,
      store_2_name: video.store_2_name ?? null,
      store_2_tel: video.store_2_tel ?? null,
      store_3_name: video.store_3_name ?? null,
      store_3_tel: video.store_3_tel ?? null,
      created_at: video.created_at,
      user: ownerProfile
        ? {
          id: ownerProfile.id ?? video.owner_id ?? null,
          name: ownerProfile.display_name ?? ownerProfile.name ?? null,
          username: ownerProfile.username ?? null,
          avatar_url: ownerProfile.avatar_url ?? null,
        }
        : {
          id: video.owner_id ?? null,
          name: null,
          username: null,
          avatar_url: null,
        },
      };
    }) || [];

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
