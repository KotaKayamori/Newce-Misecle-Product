"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

type Item = {
  id: string
  path: string
  public_url: string
  content_type: string | null
  size: number | null
  created_at: string
  title?: string | null
  description?: string | null
}

export default function MyVideosPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [uid, setUid] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setUid(null)
        setItems([])
        setLoading(false)
        return
      }
      setUid(user.id)
      const { data, error } = await supabase
        .from("user_videos")
        .select("id, path, public_url, content_type, size, created_at, title, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (error) {
        const fb = await supabase
          .from("user_videos")
          .select("id, path, public_url, content_type, size, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        const fallbackData = fb.data as any // TODO: 型を詰める
        setItems(fallbackData || [])
      } else {
        setItems((data as any) || []) // TODO: 型を詰める
      }
    } catch (e: any) {
      setError(e?.message || "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (item: Item) => {
    if (!confirm("この動画を削除しますか？")) return
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/videos/${item.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `削除に失敗しました (${res.status})`)
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id))
    } catch (e: any) {
      alert(e?.message || "削除に失敗しました")
    }
  }

  return (
    <div className="px-2 pb-2">
      {loading && <p className="text-gray-600">読み込み中…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!loading && uid === null && <p className="text-gray-600">ログインが必要です。</p>}
      {!loading && uid && items.length === 0 && <p className="text-gray-600">まだ動画がありません。</p>}

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm border">
            <div className="aspect-[9/16] bg-black">
              <video src={item.public_url} className="w-full h-full object-cover" controls playsInline />
            </div>
            <div className="p-3 text-sm">
              <p className="font-semibold text-gray-900 truncate mb-1">{item.title || item.path.split("/").pop()}</p>
              {item.description && <p className="text-gray-700 text-xs mb-1 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                <Button variant="outline" className="h-8 px-3 rounded-full" onClick={() => handleDelete(item)}>
                  削除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
