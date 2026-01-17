import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return NextResponse.json({ error: "missing bearer" }, { status: 401 })

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: me } = await sb.auth.getUser()
  if (!me?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const coverPath: string | undefined = body?.coverPath
  const title = typeof body?.title === "string" ? body.title.trim() : undefined
  const caption = typeof body?.caption === "string" ? body.caption.trim() : undefined
  const description = typeof body?.description === "string" ? body.description.trim() : undefined
  const categories =
    Array.isArray(body?.categories)
      ? body.categories.map((c: any) => String(c).trim()).filter(Boolean)
      : undefined

  const updatePayload: Record<string, any> = {}
  if (coverPath) updatePayload.cover_path = coverPath
  if (title !== undefined) updatePayload.title = title || null
  if (caption !== undefined) updatePayload.caption = caption || null
  if (description !== undefined) updatePayload.description = description || null
  if (categories !== undefined) updatePayload.categories = categories

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await sb
    .from("photo_albums")
    .update(updatePayload)
    .eq("id", params.id)
    .eq("owner_id", me.user.id)
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, id: data.id })
}
