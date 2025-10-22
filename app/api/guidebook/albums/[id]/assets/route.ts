import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = "photos"

const createAdminClient = () => {
  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!params?.id) return NextResponse.json({ error: "album id required" }, { status: 400 })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("photo_assets")
      .select("id, storage_path, order_index, width, height, created_at")
      .eq("album_id", params.id)
      .order("order_index", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const base = SUPABASE_URL.replace(/\/$/, "")
    const items = (data || []).map((asset) => ({
      id: asset.id,
      path: asset.storage_path,
      order: asset.order_index,
      width: asset.width,
      height: asset.height,
      createdAt: asset.created_at,
      url: `${base}/storage/v1/object/public/${BUCKET}/${asset.storage_path}`,
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error("guidebook albums assets error:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
