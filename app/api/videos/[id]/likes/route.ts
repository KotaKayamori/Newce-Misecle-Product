import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/auth"

async function getUserId(request: Request, supabase: ReturnType<typeof createServerClient> extends Promise<infer T> ? T : any) {
  // Prefer Bearer token, fall back to cookies
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
  if (bearer) {
    const { data } = await supabase.auth.getUser(bearer)
    if (data.user?.id) return data.user.id
  }
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id
    if (!videoId) return NextResponse.json({ error: "Missing video id" }, { status: 400 })
    const supabase = await createServerClient()
    const userId = await getUserId(request, supabase)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("video_likes").insert({ video_id: videoId, user_id: userId })
    if (error && !(error as any).code?.toString().includes("23505") && !String(error.message || "").toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id
    if (!videoId) return NextResponse.json({ error: "Missing video id" }, { status: 400 })
    const supabase = await createServerClient()
    const userId = await getUserId(request, supabase)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("video_likes").delete().eq("video_id", videoId).eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

