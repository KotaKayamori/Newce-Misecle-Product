"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import AlbumCard from "@/components/AlbumCard"
import AlbumViewerOverlay from "@/components/AlbumViewerOverlay"
import { derivePosterUrl, deriveAlbumCoverUrl } from "@/lib/media"
import type { VideoCategory } from "@/hooks/useVideoUpload"
import type { AssetItem } from "@/app/search/types"

const CATEGORY_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: "today_recommended", label: "あなたにおすすめ" },
  { value: "popular_now", label: "人気急上昇中のお店" },
  { value: "sns_popular", label: "SNSで人気のお店" },
  { value: "gen_z_popular", label: "若年層に人気のお店" },
  { value: "date_recommended", label: "デートでおすすめのお店" },
]

type Item = {
  id: string
  path: string
  public_url: string
  content_type: string | null
  size: number | null
  created_at: string
  title?: string | null
  description?: string | null
  categories?: string[] | null
}

type Album = {
  id: string
  owner_id: string
  title: string | null
  description: string | null
  caption: string | null
  categories?: string[] | null
  cover_path: string | null
  created_at: string
}

export default function MyVideosPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [uid, setUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ username?: string | null; display_name?: string | null; avatar_url?: string | null } | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(false)
  const [albumsError, setAlbumsError] = useState<string>("")
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [previewMuted, setPreviewMuted] = useState(true)
  const [albumOpen, setAlbumOpen] = useState(false)
  const [albumAssets, setAlbumAssets] = useState<AssetItem[]>([])
  const [albumIndex, setAlbumIndex] = useState(0)
  const [albumTitle, setAlbumTitle] = useState<string | null>(null)
  const [albumDescription, setAlbumDescription] = useState<string | null>(null)
  const [albumOwnerLabel, setAlbumOwnerLabel] = useState<string | null>(null)
  const [albumOwnerAvatar, setAlbumOwnerAvatar] = useState<string | null>(null)
  const [albumLoading, setAlbumLoading] = useState(false)
  const [editAlbum, setEditAlbum] = useState<Album | null>(null)
  const [editAlbumTitle, setEditAlbumTitle] = useState("")
  const [editAlbumCaption, setEditAlbumCaption] = useState("")
  const [editAlbumCategories, setEditAlbumCategories] = useState<VideoCategory[]>([])
  const [editAlbumSaving, setEditAlbumSaving] = useState(false)
  const [editAlbumError, setEditAlbumError] = useState("")
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editCaption, setEditCaption] = useState("")
  const [editCategories, setEditCategories] = useState<VideoCategory[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")

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
      // プロフィール取得（表示名/アイコン用）
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .limit(1)
        .single()
      setProfile(prof ?? null)
      const { data, error } = await supabase
        .from("videos")
        .select("id, storage_path, playback_url, created_at, title, caption, categories")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
      if (error) {
        setItems([])
      } else {
        const mapped = ((data as any) || []).map((row: any) => ({
          id: row.id,
          path: row.storage_path || row.playback_url || "",
          public_url: row.playback_url || "",
          content_type: null,
          size: null,
          created_at: row.created_at,
          title: row.title ?? null,
          description: row.caption ?? null,
          categories: Array.isArray(row.categories) ? row.categories : null,
        })) as Item[]
        setItems(mapped)
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
        .select("id, owner_id, title, description, caption, categories, cover_path, created_at")
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
    if (!confirm("この動画を削除しますか？")) return false
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
      return true
    } catch (e: any) {
      alert(e?.message || "削除に失敗しました")
      return false
    }
  }

  const openEdit = (item: Item) => {
    const validCategories = new Set(CATEGORY_OPTIONS.map((opt) => opt.value))
    setEditItem(item)
    setEditTitle(item.title ?? "")
    setEditCaption(item.description ?? "")
    setEditCategories(
      Array.isArray(item.categories)
        ? (item.categories.filter((c) => validCategories.has(c as VideoCategory)) as VideoCategory[])
        : [],
    )
    setEditError("")
  }

  const handleEditSave = async () => {
    if (!editItem) return
    if (editCategories.length === 0) {
      setEditError("カテゴリを1つ以上選択してください")
      return
    }
    setEditSaving(true)
    setEditError("")
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/videos/${editItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editTitle,
          caption: editCaption,
          categories: editCategories,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `更新に失敗しました (${res.status})`)
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === editItem.id
            ? {
                ...item,
                title: editTitle.trim() || null,
                description: editCaption.trim() || null,
                categories: editCategories,
              }
            : item,
        ),
      )
      setEditItem(null)
    } catch (e: any) {
      setEditError(e?.message || "更新に失敗しました")
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteAlbum = async (album: Album) => {
    if (!confirm("このアルバムを削除しますか？\n（アルバム内の写真も削除される場合があります）")) return false
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("ログインが必要です")
        return false
      }
      // 所有者チェックを兼ねてowner_id一致で削除
      const { error } = await supabase
        .from("photo_albums")
        .delete()
        .eq("id", album.id)
        .eq("owner_id", user.id)
      if (error) throw error
      setAlbums((prev) => prev.filter((a) => a.id !== album.id))
      return true
    } catch (e: any) {
      alert(e?.message || "アルバムの削除に失敗しました")
      return false
    }
  }

  const openAlbum = async (album: Album) => {
    try {
      setAlbumLoading(true)
      setAlbumTitle(album.title || album.description || album.caption || "アルバム")
      setAlbumDescription(album.description || album.caption || null)
      const ownerLabel =
        profile?.username ? `@${profile.username}` : profile?.display_name || "あなた"
      setAlbumOwnerLabel(ownerLabel)
      setAlbumOwnerAvatar(profile?.avatar_url ?? null)
      const res = await fetch(`/api/guidebook/albums/${album.id}/assets`, { cache: "no-store" })
      if (!res.ok) throw new Error("アルバムの取得に失敗しました")
      const json = await res.json().catch(() => ({}))
      const assets: AssetItem[] = Array.isArray(json?.items) ? json.items : []
      setAlbumAssets(assets)
      setAlbumIndex(0)
      setAlbumOpen(true)
    } catch (e: any) {
      alert(e?.message || "アルバムの中身を取得できませんでした")
      setAlbumAssets([])
      setAlbumOpen(false)
    } finally {
      setAlbumLoading(false)
    }
  }

  const openEditAlbum = (album: Album) => {
    const validCategories = new Set(CATEGORY_OPTIONS.map((opt) => opt.value))
    setEditAlbum(album)
    setEditAlbumTitle(album.title ?? "")
    setEditAlbumCaption(album.caption ?? album.description ?? "")
    setEditAlbumCategories(
      Array.isArray(album.categories)
        ? (album.categories.filter((c) => validCategories.has(c as VideoCategory)) as VideoCategory[])
        : [],
    )
    setEditAlbumError("")
  }

  const handleAlbumEditSave = async () => {
    if (!editAlbum) return
    setEditAlbumSaving(true)
    setEditAlbumError("")
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/guidebook/albums/${editAlbum.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editAlbumTitle,
          caption: editAlbumCaption,
          description: editAlbumCaption,
          categories: editAlbumCategories,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `更新に失敗しました (${res.status})`)
      }
      setAlbums((prev) =>
        prev.map((album) =>
          album.id === editAlbum.id
            ? {
                ...album,
                title: editAlbumTitle.trim() || null,
                caption: editAlbumCaption.trim() || null,
                description: editAlbumCaption.trim() || null,
                categories: editAlbumCategories,
              }
            : album,
        ),
      )
      setEditAlbum(null)
    } catch (e: any) {
      setEditAlbumError(e?.message || "更新に失敗しました")
    } finally {
      setEditAlbumSaving(false)
    }
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
            {items.map((item, idx) => (
              <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm border">
                <button
                  type="button"
                  className="relative aspect-[9/16] w-full bg-gray-100"
                  onClick={() => setPreviewIndex(idx)}
                  aria-label={`${item.title || "動画"}を再生`}
                >
                  {/* サムネのみ表示。videoはロードしない */}
                  <img
                    src={derivePosterUrl(item.public_url, item.path) || "/placeholder.jpg"}
                    alt={item.title || "動画"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-l-[18px] border-l-black border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </button>
                <div className="p-3 text-sm">
                  <p className="font-semibold text-gray-900 truncate mb-1">{item.title || item.path.split("/").pop()}</p>
                  {item.description && <p className="text-gray-700 text-xs mb-1 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    <Button variant="outline" className="h-8 px-3 rounded-full" onClick={() => openEdit(item)}>
                      編集
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
                <AlbumCard
                  coverUrl={deriveAlbumCoverUrl(a.cover_path)}
                  title={a.title || a.description || "アルバム"}
                  onClickCard={() => openAlbum(a)}
                  showTopBookmark={false}
                  bottomMetaVariant="none"
                />
                <div className="px-3 pt-2 pb-3 space-y-2">
                  <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                    {a.title || a.description || "アルバム"}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      className="h-9 px-4 rounded-full"
                      onClick={() => openEditAlbum(a)}
                    >
                      編集
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {editItem && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[75vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => setEditItem(null)}
                className="text-lg text-gray-800 hover:text-gray-900"
              >
                ＜
              </button>
              <h2 className="text-lg font-semibold">動画情報を編集</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="タイトルを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">キャプション</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="キャプションを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリー <span className="ml-1 text-xs text-gray-500">(複数選択可)</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const checked = editCategories.includes(opt.value)
                    return (
                      <label key={opt.value} className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            setEditCategories((prev) => {
                              if (e.target.checked) {
                                return Array.from(new Set([...prev, opt.value]))
                              }
                              return prev.filter((v) => v !== opt.value)
                            })
                          }}
                        />
                        <span className="text-sm text-gray-800">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? "更新中..." : "更新する"}
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (!editItem) return
                  const deleted = await handleDelete(editItem)
                  if (deleted) setEditItem(null)
                }}
                disabled={editSaving}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewIndex != null && previewIndex >= 0 && previewIndex < items.length && (
        <VideoFullscreenOverlay
          open
          video={{
            id: items[previewIndex].id,
            playback_url: items[previewIndex].public_url,
            poster_url: derivePosterUrl(items[previewIndex].public_url, items[previewIndex].path) || undefined,
            title: items[previewIndex].title ?? undefined,
            caption: items[previewIndex].description ?? undefined,
          }}
          ownerHandle={profile?.username ? `@${profile.username}` : profile?.display_name || "あなた"}
          ownerAvatarUrl={profile?.avatar_url ?? null}
          bookmarked={false}
          onToggleBookmark={() => {}}
          onShare={async () => {
            try {
              const url = items[previewIndex].public_url
              if (navigator.share) await navigator.share({ url })
              else {
                await navigator.clipboard.writeText(url)
                alert("リンクをコピーしました")
              }
            } catch {}
          }}
          onClose={() => setPreviewIndex(null)}
          muted={previewMuted}
          onToggleMuted={() => setPreviewMuted((m) => !m)}
        />
      )}

      {albumOpen && (
        <AlbumViewerOverlay
          open={albumOpen}
          assets={albumAssets}
          index={albumIndex}
          loading={albumLoading}
          onClose={() => setAlbumOpen(false)}
          onIndexChange={(next) => {
            const clamped = Math.max(0, Math.min(next, albumAssets.length - 1))
            setAlbumIndex(clamped)
          }}
          title={albumTitle}
          ownerAvatarUrl={albumOwnerAvatar}
          ownerLabel={albumOwnerLabel ?? undefined}
          description={albumDescription ?? undefined}
          onShare={async () => {
            const url = albumAssets[albumIndex]?.url
            if (!url) return
            try {
              if (navigator.share) await navigator.share({ url })
              else {
                await navigator.clipboard.writeText(url)
                alert("リンクをコピーしました")
              }
            } catch {}
          }}
        />
      )}

      {editAlbum && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[75vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => setEditAlbum(null)}
                className="text-lg text-gray-800 hover:text-gray-900"
              >
                ＜
              </button>
              <h2 className="text-lg font-semibold">アルバム情報を編集</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                <input
                  type="text"
                  value={editAlbumTitle}
                  onChange={(e) => setEditAlbumTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="タイトルを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">キャプション</label>
                <textarea
                  value={editAlbumCaption}
                  onChange={(e) => setEditAlbumCaption(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="キャプションを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリー <span className="ml-1 text-xs text-gray-500">(複数選択可)</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const checked = editAlbumCategories.includes(opt.value)
                    return (
                      <label key={opt.value} className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            setEditAlbumCategories((prev) => {
                              if (e.target.checked) {
                                return Array.from(new Set([...prev, opt.value]))
                              }
                              return prev.filter((v) => v !== opt.value)
                            })
                          }}
                        />
                        <span className="text-sm text-gray-800">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {editAlbumError && <p className="text-sm text-red-600">{editAlbumError}</p>}

              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={handleAlbumEditSave}
                disabled={editAlbumSaving}
              >
                {editAlbumSaving ? "更新中..." : "更新する"}
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (!editAlbum) return
                  const deleted = await handleDeleteAlbum(editAlbum)
                  if (deleted) setEditAlbum(null)
                }}
                disabled={editAlbumSaving}
              >
                削除する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
