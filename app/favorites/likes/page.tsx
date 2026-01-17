"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navigation from "@/components/navigation"

type V = { id: string; playback_url: string; title: string | null; caption: string | null; created_at: string }

export default function FavoritesLikesPage() {
  const [items, setItems] = useState<V[] | null>(null)
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setNeedLogin(true)
        setItems([])
        return
      }
      const { data, error } = await supabase
        .from("video_likes")
        .select("created_at, videos(id, playback_url, title, caption, created_at)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (!error) setItems(((data ?? []) as any[]).map((d) => d.videos as V))
      else setItems([])
    })()
  }, [])

  if (needLogin) return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <p className="text-gray-700">ログインしてください</p>
    </div>
  )
  if (!items) return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <p className="text-gray-500">読み込み中…</p>
    </div>
  )
  if (items.length === 0)
    return (
      <div className="min-h-screen bg-white pb-20 px-6 pt-8">
        <p className="text-gray-700">まだお気に入りがありません</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <h1 className="text-xl font-semibold mb-4">いいねした動画</h1>
      <div className="grid grid-cols-2 gap-4">
        {items.map((v) => (
          <div key={v.id} className="bg-white rounded-lg overflow-hidden border">
            <div className="aspect-[9/16] bg-black">
              <video src={v.playback_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
            </div>
            <div className="p-2">
              <p className="text-sm font-medium line-clamp-1">{v.title || ""}</p>
              {v.caption && <p className="text-xs text-gray-600 line-clamp-2">{v.caption}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

