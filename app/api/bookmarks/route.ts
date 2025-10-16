import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
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

    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "videoIdが必要です" }, { status: 400 })
    }

    // 既存のブックマークをチェック
    const { data: existingBookmark, error: checkError } = await supabase
      .from('video_bookmarks')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Bookmark check error:', checkError)
      return NextResponse.json({ error: 'ブックマークの確認に失敗しました' }, { status: 500 })
    }

    if (existingBookmark) {
      // ブックマークを削除
      const { error: deleteError } = await supabase
        .from('video_bookmarks')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Bookmark delete error:', deleteError)
        return NextResponse.json({ error: 'ブックマークの削除に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: false, message: 'ブックマークを削除しました' })
    } else {
      // ブックマークを追加
      const { error: insertError } = await supabase
        .from('video_bookmarks')
        .insert({
          video_id: videoId,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Bookmark insert error:', insertError)
        return NextResponse.json({ error: 'ブックマークの追加に失敗しました' }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: true, message: 'ブックマークしました' })
    }

  } catch (error) {
    console.error('Bookmark toggle error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ bookmarks: [] })
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
      return NextResponse.json({ bookmarks: [] })
    }

    // ブックマークした動画を取得
    const { data: bookmarks, error } = await supabase
      .from('video_bookmarks')
      .select(`
        id,
        created_at,
        videos!inner (
          id,
          title,
          category,
          playback_url,
          caption,
          created_at,
          owner_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Bookmarks fetch error:', error)
      return NextResponse.json({ error: 'ブックマークの取得に失敗しました' }, { status: 500 })
    }

    // レスポンスデータを統一形式に変換
    const formattedBookmarks = (bookmarks || []).map(bookmark => {
      const video = Array.isArray(bookmark.videos) ? bookmark.videos[0] : bookmark.videos

      return {
        id: bookmark.id,
        created_at: bookmark.created_at,
        videos: {
          id: video?.id,
          title: video?.title || '無題の動画',
          category: video?.category,
          playback_url: video?.playback_url,
          caption: video?.caption,
          created_at: video?.created_at,
          owner_id: video?.owner_id
        }
      }
    })

    return NextResponse.json({ 
      bookmarks: formattedBookmarks
    })

  } catch (error) {
    console.error('Bookmarks API error:', error)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}