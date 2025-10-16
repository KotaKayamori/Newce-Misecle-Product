export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY

function normalizeKey(input: string) {
  let k = String(input || "")
    .replace(/^https?:\/\/[^]+?\/object\/(public|sign)\/videos\//, "")
    .replace(/^videos\//, "")
    .replace(/^\/+/, "")
  try { k = decodeURIComponent(k) } catch {}
  try { k = decodeURIComponent(k) } catch {}
  if (!k || k.includes("..")) throw new Error("invalid key")
  return k
}

export async function POST(req: NextRequest) {
  try {
    const posterPathRaw = req.headers.get("x-poster-path") || ""
    if (!posterPathRaw) return NextResponse.json({ error: "missing x-poster-path" }, { status: 400 })

    const key = normalizeKey(posterPathRaw)
    const uidFromKey = key.split("/")[0]

    const authHeader = req.headers.get("authorization") || ""
    const useService = Boolean(SUPABASE_SERVICE_KEY)
    const supabase = createClient(
      SUPABASE_URL,
      useService ? SUPABASE_SERVICE_KEY! : SUPABASE_ANON_KEY,
      useService
        ? { auth: { persistSession: false, autoRefreshToken: false } }
        : authHeader
          ? { global: { headers: { Authorization: authHeader } } }
          : undefined,
    )

    if (!useService) {
      const { data: udata } = await supabase.auth.getUser().catch(() => ({ data: null as any }))
      if (udata?.user && uidFromKey && udata.user.id !== uidFromKey) {
        return NextResponse.json({ error: "uid mismatch" }, { status: 403 })
      }
    }

    const folder = key.split("/").slice(0, -1).join("/")
    const fname = key.split("/").pop()!
    try {
      const { data: listed } = await supabase.storage.from("videos").list(folder, { limit: 1, search: fname })
      if (listed?.some((f: any) => f.name === fname)) {
        return NextResponse.json({ ok: true, existed: true }, { status: 200 })
      }
    } catch {}

    const ab = await req.arrayBuffer()
    if (!ab || ab.byteLength < 50) return NextResponse.json({ error: "empty body" }, { status: 400 })

    const file = new Blob([ab], { type: "image/webp" })
    const { error: upErr } = await supabase.storage.from("videos").upload(key, file, {
      contentType: "image/webp",
      cacheControl: "31536000, immutable",
      upsert: false,
    })
    if (upErr) {
      const msg = (upErr as any)?.message?.toLowerCase?.() || ""
      const code = (upErr as any)?.status || (upErr as any)?.statusCode
      if (code === 409 || msg.includes("already exists") || msg.includes("duplicate")) {
        return NextResponse.json({ ok: true, existed: true }, { status: 200 })
      }
      return NextResponse.json({ error: (upErr as any)?.message || "upload_error" }, { status: 400 })
    }

    return NextResponse.json({ ok: true, existed: false }, { status: 200 })
  } catch (e: any) {
    console.error("upload-poster fatal:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
