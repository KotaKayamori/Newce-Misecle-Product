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

    const storagePath = del?.storage_path as string | undefined
    if (storagePath) {
      const { error: rmErr } = await supabase.storage.from("videos").remove([storagePath])
      // Ignore 404; log other issues
      const status = (rmErr as any)?.status
      if (rmErr && status !== 404) console.warn("storage remove failed", rmErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}

