"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

type Album = {
  id: string
  owner_id: string
  title: string | null
  description: string | null
  caption: string | null
  cover_path: string | null
  created_at: string
}

export default function MyVideosPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [uid, setUid] = useState<string | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(false)
  const [albumsError, setAlbumsError] = useState<string>("")

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
        setAlbums([])
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

  const loadAlbums = async () => {
    setAlbumsLoading(true)
    setAlbumsError("")
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setAlbums([])
        setAlbumsLoading(false)
        return
      }
      const { data, error } = await supabase
        .from("photo_albums")
        .select("id, owner_id, title, description, caption, cover_path, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      setAlbums((data as any) || [])
    } catch (e: any) {
      setAlbumsError(e?.message || "アルバムの読み込みに失敗しました")
      setAlbums([])
    } finally {
      setAlbumsLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadAlbums()
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

  const handleDeleteAlbum = async (album: Album) => {
    if (!confirm("このアルバムを削除しますか？\n（アルバム内の写真も削除される場合があります）")) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("ログインが必要です")
        return
      }
      // 所有者チェックを兼ねてowner_id一致で削除
      const { error } = await supabase
        .from("photo_albums")
        .delete()
        .eq("id", album.id)
        .eq("owner_id", user.id)
      if (error) throw error
      setAlbums((prev) => prev.filter((a) => a.id !== album.id))
    } catch (e: any) {
      alert(e?.message || "アルバムの削除に失敗しました")
    }
  }

  function deriveAlbumCoverUrl(coverPath?: string | null): string | null {
    if (!coverPath) return null
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
    if (!base) return null
    const objectPath = coverPath.replace(/^\/+/, "")
    return `${base}/storage/v1/object/public/photos/${objectPath}`
  }

  return (
    <div className="px-2 pb-2">
      <Tabs defaultValue="videos" className="w-full">
        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsList className="inline-flex w-max gap-3 bg-transparent h-auto p-0 border-0">
            <TabsTrigger value="videos" className="shrink-0 px-3 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2">
              動画
            </TabsTrigger>
            <TabsTrigger value="albums" className="shrink-0 px-3 data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2">
              アルバム
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="videos" className="mt-4">
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
        </TabsContent>

        <TabsContent value="albums" className="mt-4">
          {albumsLoading && <p className="text-gray-600">読み込み中…</p>}
          {albumsError && <p className="text-red-600 text-sm">{albumsError}</p>}
          {!albumsLoading && uid === null && <p className="text-gray-600">ログインが必要です。</p>}
          {!albumsLoading && uid && albums.length === 0 && <p className="text-gray-600">まだアルバムがありません。</p>}

          <div className="grid grid-cols-2 gap-4">
            {albums.map((a) => (
              <div key={a.id} className="bg-white rounded-lg overflow-hidden shadow-sm border">
                <div className="aspect-[9/16] bg-gray-100">
                  {deriveAlbumCoverUrl(a.cover_path) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={deriveAlbumCoverUrl(a.cover_path)!} alt={a.title ?? "album"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Cover</div>
                  )}
                </div>
                <div className="p-3 text-sm">
                  <p className="font-semibold text-gray-900 truncate mb-1">{a.title || a.description || "アルバム"}</p>
                  {(a.description || a.caption) && (
                    <p className="text-gray-700 text-xs mb-1 line-clamp-2">{a.description || a.caption}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{new Date(a.created_at).toLocaleDateString()}</span>
                    <Button variant="outline" className="h-8 px-3 rounded-full" onClick={() => handleDeleteAlbum(a)}>
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
