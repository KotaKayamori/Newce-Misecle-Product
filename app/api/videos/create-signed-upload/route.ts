import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 環境変数：Anon を使う（SRKは絶対使わない。RLSでユーザー権限評価したい）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 相対キー正規化
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

// content-type の許可判定（video/* または image/webp）
function isAllowedContentType(ct: string | undefined | null) {
  if (!ct) return false
  const lc = String(ct).toLowerCase()
  return lc === "image/webp" || lc.startsWith("video/")
}

function extFromContentType(ct: string | undefined | null): string | null {
  if (!ct) return null
  const lc = String(ct).toLowerCase()
  if (lc === "image/webp") return "webp"
  if (lc === "video/mp4") return "mp4"
  if (lc === "video/quicktime") return "mov"
  if (lc === "video/x-m4v") return "m4v"
  if (lc === "video/webm") return "webm"
  if (lc === "video/ogg") return "ogg"
  return null
}

function extFromFilename(name: string | undefined | null): string | null {
  if (!name) return null
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  return m?.[1] || null
}

function pad2(n: number) { return n < 10 ? `0${n}` : String(n) }

export async function POST(req: NextRequest) {
  try {
    // 1) Bearer を取得
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) {
      return NextResponse.json({ error: "missing bearer" }, { status: 401 })
    }

    // 2) Bearer を Supabase クライアントへ橋渡し
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // 3) USER を取得（ここが null なら 401）
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const user = userData.user

    // 4) 入力バリデーション（4xx で返す）
    const body = await req.json().catch(() => ({}))
    const filename: string | undefined = body?.filename ?? body?.fileName ?? body?.name
    const contentType: string | undefined = body?.contentType
    const pathOverrideRaw: string | undefined = body?.pathOverride
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "filename required" }, { status: 400 })
    }
    if (!isAllowedContentType(contentType)) {
      return NextResponse.json({ error: "invalid contentType" }, { status: 400 })
    }

    // 5) キー決定
    let key: string
    if (pathOverrideRaw && typeof pathOverrideRaw === "string") {
      // クライアント指定（例: poster の .webp を動画キーから派生）
      key = normalizeKey(pathOverrideRaw)
      const uidFromKey = key.split("/")[0]
      if (uidFromKey !== user.id) {
        return NextResponse.json({ error: "forbidden path (uid mismatch)" }, { status: 403 })
      }
    } else {
      // サーバ生成（動画など pathOverride 未指定のケース）
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = pad2(now.getMonth() + 1)
      const uuid = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const extByName = extFromFilename(filename)
      const extByCt = extFromContentType(contentType)
      const ext = (extByName && /^(mp4|mov|m4v|webm|ogg|webp)$/.test(extByName) ? extByName : extByCt) || "bin"
      key = `${user.id}/${yyyy}/${mm}/${uuid}.${ext}`
    }

    // 6) 署名URLの発行（ユーザー権限で評価。SRKは使わない）
    const { data: signed, error: signErr } = await supabase.storage
      .from("videos")
      .createSignedUploadUrl(key)

    if (signErr) {
      // ここで 403 が来る場合 → Storage RLS を確認：
      // INSERT: bucket_id='videos' AND foldername(name)[1] = auth.uid()
      return NextResponse.json({ error: signErr.message }, { status: 403 })
    }

    return NextResponse.json({
      bucket: "videos",
      path: signed.path,
      token: signed.token,
      cacheControl: "31536000, immutable",
    })
  } catch (e: any) {
    // 予期せぬ例外のみ 500
    console.error("create-signed-upload fatal:", e)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
