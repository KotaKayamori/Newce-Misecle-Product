export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

// Minimal placeholder to avoid build-time module resolution errors when ffmpeg/sharp are not installed.
// Returns 501 so the client can fall back gracefully.
export async function POST(req: NextRequest) {
  try {
    const { playbackUrl, posterPath } = await req.json()
    if (!playbackUrl || !posterPath) return NextResponse.json({ error: "bad_request" }, { status: 400 })
    return NextResponse.json({ error: "server_missing_deps" }, { status: 501 })
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
