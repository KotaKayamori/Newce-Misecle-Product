import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"])
const BUCKET = "photos"

function extFromContentType(ct: string | undefined | null): string | null {
  if (!ct) return null
  const lc = ct.toLowerCase()
  if (lc === "image/jpeg" || lc === "image/jpg") return "jpg"
  if (lc === "image/png") return "png"
  if (lc === "image/webp") return "webp"
  if (lc === "image/heic") return "heic"
  if (lc === "image/heif") return "heif"
  return null
}

function extFromFilename(name: string | undefined | null): string | null {
  if (!name) return null
  const m = name.trim().toLowerCase().match(/\.([a-z0-9]+)$/)
  return m?.[1] || null
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "missing bearer" }, { status: 401 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const albumId: string | undefined = body?.albumId
    const filename: string | undefined = body?.filename
    const contentType: string | undefined = body?.contentType

    if (!albumId) return NextResponse.json({ error: "albumId required" }, { status: 400 })
    if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 })

    const { data: album, error: albumErr } = await supabase
      .from("photo_albums")
      .select("id, owner_id")
      .eq("id", albumId)
      .single()

    if (albumErr || !album) return NextResponse.json({ error: "album not accessible" }, { status: 403 })
    if (album.owner_id !== userData.user.id) return NextResponse.json({ error: "forbidden album" }, { status: 403 })

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = pad2(now.getMonth() + 1)
    const uuid =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((globalThis as any).crypto?.randomUUID?.() as string | undefined) ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const ext = extFromFilename(filename) || extFromContentType(contentType) || "jpg"
    if (!ALLOWED_EXTENSIONS.has(ext)) return NextResponse.json({ error: "unsupported file type" }, { status: 400 })

    const key = `${userData.user.id}/${albumId}/${yyyy}/${mm}/${uuid}.${ext}`

    const { data: signed, error: signErr } = await supabase.storage.from(BUCKET).createSignedUploadUrl(key, {
      upsert: false,
    })
    if (signErr || !signed) {
      return NextResponse.json({ error: signErr?.message || "failed to sign" }, { status: 403 })
    }

    return NextResponse.json({
      bucket: BUCKET,
      path: signed.path,
      token: signed.token,
      cacheControl: "31536000, immutable",
    })
  } catch (e) {
    console.error("guidebook create-signed-upload error:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
