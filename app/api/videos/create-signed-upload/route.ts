import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createServerClient } from "@/lib/auth"

// Helper to derive extension from content type or filename
function getExt(fileName: string | undefined, contentType: string): string {
  const byName = (fileName || "").split(".").pop()?.toLowerCase()
  const nameOk = byName && /^(mp4|webm|mov|m4v|ogg)$/.test(byName) ? byName : undefined
  if (nameOk) return nameOk

  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-m4v": "m4v",
    "video/ogg": "ogg",
  }
  return map[contentType.toLowerCase()] ?? "mp4"
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const fileName = typeof body?.fileName === "string" ? body.fileName : undefined
    const contentType = typeof body?.contentType === "string" ? body.contentType : ""

    if (!contentType || !contentType.toLowerCase().startsWith("video/")) {
      return NextResponse.json({ error: "Invalid contentType. Expected video/*" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Authenticate: Authorization Bearer token (preferred), fallback to cookies
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

    // Upload allowlist: only users present in allowed_uploaders can request signed upload
    try {
      const { data: allow } = await supabase
        .from("allowed_uploaders")
        .select("user_id")
        .eq("user_id", userId)
        .single()
      if (!allow) {
        return NextResponse.json({ error: "Forbidden: uploader not allowed" }, { status: 403 })
      }
    } catch (e) {
      // If the table doesn't exist yet, fail closed for safety
      return NextResponse.json({ error: "Forbidden: uploader not allowed" }, { status: 403 })
    }

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const ext = getExt(fileName, contentType)
    const objectPath = `${userId}/${yyyy}/${mm}/${randomUUID()}.${ext}`

    const { data, error } = await supabase.storage.from("videos").createSignedUploadUrl(objectPath)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // supabase-js returns signedUrl (and/or token depending on version)
    const signedUrl = (data as any)?.signedUrl as string | undefined
    let token = (data as any)?.token as string | undefined
    if (!token && signedUrl) {
      try {
        const u = new URL(signedUrl)
        token = u.searchParams.get("token") ?? undefined
      } catch {}
    }

    const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(objectPath)

    return NextResponse.json({
      bucket: "videos",
      path: objectPath,
      token,
      signedUrl,
      publicUrl: publicUrlData.publicUrl,
      cacheControl: "31536000",
      upsert: false,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 })
  }
}
