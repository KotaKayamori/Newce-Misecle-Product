import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = "photos"

type CreateAlbumBody = {
  title?: string
  description?: string | null
  caption?: string | null
  visibility?: "public" | "private"
}

const createAdminClient = () => {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 100)
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("photo_albums")
      .select("id, owner_id, title, description, caption, visibility, cover_path, created_at")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const base = SUPABASE_URL.replace(/\/$/, "")
    const items = (data || []).map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description ?? album.caption ?? null,
      coverPath: album.cover_path ?? null,
      coverUrl: album.cover_path ? `${base}/storage/v1/object/public/${BUCKET}/${album.cover_path}` : null,
      createdAt: album.created_at,
      ownerId: album.owner_id,
    }))

    return NextResponse.json(
      {
        items,
        nextOffset: items.length < limit ? null : offset + limit,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (e) {
    console.error("guidebook albums GET error:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "missing bearer" }, { status: 401 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: me } = await supabase.auth.getUser()
    if (!me?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as CreateAlbumBody
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 })

    const { data, error } = await supabase
      .from("photo_albums")
      .insert({
        owner_id: me.user.id,
        title,
        description: body.description ?? null,
        caption: body.caption ?? null,
        visibility: body.visibility === "private" ? "private" : "public",
      })
      .select("id, owner_id, title, description, caption, visibility, cover_path, created_at")
      .single()

    if (error || !data) return NextResponse.json({ error: "failed to create album" }, { status: 500 })

    return NextResponse.json({ album: data }, { status: 201 })
  } catch (e) {
    console.error("guidebook/albums POST error:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
