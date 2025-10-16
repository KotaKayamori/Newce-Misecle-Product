import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // ユーザーのコンテキストでSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: "認証が無効です" }, { status: 401 })
    }

    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: "videoIdが必要です" }, { status: 400 })
    }

    // 既存のいいねをチェック
    const { data: existingLike, error: checkError } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Like check error:', checkError)
      return NextResponse.json({ error: 'いいねの確認に失敗しました' }, { status: 500 })
    }

    if (existingLike) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Like delete error:', deleteError)
        return NextResponse.json({ error: 'いいねの削除に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ liked: false, message: 'いいねを削除しました' })
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Like insert error:', insertError)
        return NextResponse.json({ error: 'いいねの追加に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ liked: true, message: 'いいねしました' })
    }

  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    const videoId = params.id

    // ユーザーのコンテキストでSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? {
          Authorization: authHeader
        } : {}
      }
    })

    // いいね数を取得
    const { count, error: countError } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId)

    if (countError) {
      console.error('Like count error:', countError)
      return NextResponse.json({ error: 'いいね数の取得に失敗しました' }, { status: 500 })
    }

    let isLiked = false

    // ユーザーがログインしている場合、いいね状態をチェック
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userLike, error: likeError } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .single()

        if (!likeError && userLike) {
          isLiked = true
        }
      }
    }

    return NextResponse.json({ 
      count: count || 0, 
      isLiked 
    })

  } catch (error) {
    console.error('Like status error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

