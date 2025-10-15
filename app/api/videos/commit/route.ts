import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/auth"
import { ca } from "date-fns/locale"

type Body = {
  path?: string
  publicUrl?: string
  title?: string
  caption?: string
  category?: string
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

    // Insert into videos (public feed)
    const insertPayload = {
      owner_id: userId,
      playback_url: playbackUrl,
      storage_path: path,
      title: body.title?.trim() || null,
      caption: body.caption?.trim() || null,
      category: body.category || null,
    }

    const { error: vErr } = await supabase.from("videos").insert(insertPayload)
    if (vErr) {
      // Unique violation (same path) → treat as conflict
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
        category: insertPayload.category,
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

