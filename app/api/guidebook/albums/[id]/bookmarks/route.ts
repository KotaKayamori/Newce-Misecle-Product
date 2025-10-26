import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    const token = authHeader.split(" ")[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "認証が無効です" }, { status: 401 })

    const albumId = params.id
    const { data: existing, error: ckErr } = await supabase
      .from("photo_album_bookmarks")
      .select("id")
      .eq("album_id", albumId)
      .eq("user_id", user.id)
      .single()
    if (ckErr && (ckErr as any).code !== 'PGRST116') return NextResponse.json({ error: '確認に失敗しました' }, { status: 500 })

    if (existing) {
      const { error } = await supabase.from("photo_album_bookmarks").delete().eq("album_id", albumId).eq("user_id", user.id)
      if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
      return NextResponse.json({ bookmarked: false })
    } else {
      const { error } = await supabase.from("photo_album_bookmarks").insert({ album_id: albumId, user_id: user.id, created_at: new Date().toISOString() })
      if (error) return NextResponse.json({ error: '追加に失敗しました' }, { status: 500 })
      return NextResponse.json({ bookmarked: true })
    }
  } catch (e) {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const albumId = params.id
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: authHeader ? { Authorization: authHeader } : {} } })

    const { count, error: cErr } = await supabase.from("photo_album_bookmarks").select("*", { count: 'exact', head: true }).eq("album_id", albumId)
    if (cErr) return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })

    let isBookmarked = false
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("photo_album_bookmarks").select("id").eq("album_id", albumId).eq("user_id", user.id).single()
        if (data) isBookmarked = true
      }
    }

    return NextResponse.json({ count: count || 0, isBookmarked })
  } catch (e) {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}


