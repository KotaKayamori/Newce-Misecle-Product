import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/auth"

type Body = {
  path?: string
  publicUrl?: string
  title?: string
  caption?: string
  categories?: string[] // 変更: category -> categories(string[])
  stores?: { name?: string | null; tel?: string | null }[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Resolve user (Bearer preferred, then cookies)
    let userId: string | null = null
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
    if (bearer) {
      const { data } = await supabase.auth.getUser(bearer)
      userId = data.user?.id ?? null
    }
    if (!userId) {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as Body
    const path = (body.path || "").trim()
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 })
    // Basic safety: ensure the path belongs to the uploader prefix
    if (!path.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: "Invalid path prefix" }, { status: 400 })
    }

    // Build a trusted public URL from path rather than trusting body.publicUrl
    const { data: pub } = supabase.storage.from("videos").getPublicUrl(path)
    const playbackUrl = pub.publicUrl
    if (!playbackUrl) {
      return NextResponse.json({ error: "Failed to resolve public URL" }, { status: 400 })
    }

    // 入力検証: categories(string[]) 必須
    const categoriesRaw = Array.isArray(body.categories) ? body.categories : []
    const categories = categoriesRaw
      .map((c) => (typeof c === "string" ? c.trim() : ""))
      .filter((c) => c.length > 0)

    if (categories.length === 0) {
      return NextResponse.json({ error: "categories is required (string[])" }, { status: 400 })
    }

    const stores = Array.isArray(body.stores)
      ? body.stores.slice(0, 3).map((store) => {
          const name = typeof store?.name === "string" ? store.name.trim() : ""
          const tel = typeof store?.tel === "string" ? store.tel.trim() : ""
          return { name: name || null, tel: tel || null }
        })
      : []

    // Insert into videos (public feed)
    const insertPayload = {
      owner_id: userId,
      playback_url: playbackUrl,
      storage_path: path,
      title: body.title?.trim() || null,
      caption: body.caption?.trim() || null,
      categories, // 変更: categories列に保存
      store_1_name: stores[0]?.name ?? null,
      store_1_tel: stores[0]?.tel ?? null,
      store_2_name: stores[1]?.name ?? null,
      store_2_tel: stores[1]?.tel ?? null,
      store_3_name: stores[2]?.name ?? null,
      store_3_tel: stores[2]?.tel ?? null,
    }

    const { error: vErr } = await supabase.from("videos").insert(insertPayload)
    if (vErr) {
      const status = vErr.message?.toLowerCase().includes("duplicate") ? 409 : 400
      return NextResponse.json({ error: vErr.message }, { status })
    }

    // Optional: keep user_videos in sync during migration (best effort)
    try {
      await supabase.from("user_videos").insert({
        user_id: userId,
        path,
        public_url: playbackUrl,
        title: insertPayload.title,
        description: insertPayload.caption,
        // 互換用: user_videos 側が単一 category の場合は先頭を入れる（なければ null）
        category: categories[0] ?? null,
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
