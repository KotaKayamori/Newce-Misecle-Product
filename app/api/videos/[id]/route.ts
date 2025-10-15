import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/auth"

async function getUserId(request: Request, supabase: ReturnType<typeof createServerClient> extends Promise<infer T> ? T : any) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
  if (bearer) {
    const { data } = await supabase.auth.getUser(bearer)
    if (data.user?.id) return data.user.id
  }
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

function normalizeStorageKey(input: string | null | undefined): string | null {
  if (!input) return null
  try {
    let s = decodeURIComponent(String(input))
    // If full URL → extract after '/videos/' prefix
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s)
      const i = u.pathname.indexOf('/videos/')
      if (i >= 0) s = u.pathname.substring(i + '/videos/'.length)
    }
    // Strip leading slashes and bucket prefix
    s = s.replace(/^\/+/, '')
    if (s.startsWith('videos/')) s = s.substring('videos/'.length)
    return s || null
  } catch {
    return String(input)
      .replace(/^\/+/, '')
      .replace(/^videos\//, '') || null
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const userId = await getUserId(request, supabase)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const id = params.id
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Ensure ownership and fetch storage_path
    const { data: row, error: selErr } = await supabase
      .from("videos")
      .select("storage_path, owner_id")
      .eq("id", id)
      .single()
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 })
    if (!row || row.owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: del, error: delErr } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("owner_id", userId)
      .select("storage_path")
      .single()
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 })

    const rawPath = (del as any)?.storage_path || (row as any)?.storage_path
    const key = normalizeStorageKey(rawPath)
    if (key) {
      const { error: rmErr } = await supabase.storage.from("videos").remove([key])
      if (rmErr) {
        const code = (rmErr as any)?.status || (rmErr as any)?.code
        const msg = (rmErr as any)?.message || String(rmErr)
        if (code === 404 || /not\s*found/i.test(msg)) {
          // treat as success
        } else {
          console.warn("storage remove failed", { key, code, msg })
        }
      }
      // Best effort: remove poster with same basename and .webp extension
      const posterKey = key.replace(/\.[^.]+$/, ".webp")
      const { error: rmPosterErr } = await supabase.storage.from("videos").remove([posterKey])
      if (rmPosterErr) {
        const pcode = (rmPosterErr as any)?.status || (rmPosterErr as any)?.code
        const pmsg = (rmPosterErr as any)?.message || String(rmPosterErr)
        if (pcode !== 404 && !/not\s*found/i.test(pmsg)) {
          console.warn("poster remove failed", { key: posterKey, code: pcode, msg: pmsg })
        }
      }
    } else {
      console.warn("storage remove skipped: empty key", { id, rawPath })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

