"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type V = { id: string; owner_id: string; storage_path: string | null }

function derivePosterKey(storagePath: string): string {
  let s = storagePath || ""
  try { s = decodeURIComponent(s) } catch {}
  try { s = decodeURIComponent(s) } catch {}
  s = s
    .replace(/^https?:\/\/[^]+?\/object\/(public|sign)\/videos\//, "")
    .replace(/^videos\//, "")
    .replace(/^\/+/, "")
  if (!s || s.includes("..")) return ""
  return s.replace(/\.[^.]+$/, ".webp")
}

async function headExists(publicUrl: string): Promise<boolean> {
  try {
    const r = await fetch(publicUrl, { method: "HEAD", cache: "no-store" })
    return r.ok
  } catch {
    return false
  }
}

export default function CheckThumbnailsPage() {
  const [videos, setVideos] = useState<V[]>([])
  const [onlyMine, setOnlyMine] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [missing, setMissing] = useState<{ id: string; posterKey: string }[]>([])
  const [have, setHave] = useState(0)
  const [total, setTotal] = useState(0)
  const cancelRef = useRef(false)

  // resolve current user once
  useEffect(() => {
    ;(async () => {
      try {
        const { data: sess } = await supabase.auth.getSession()
        setUserId(sess.session?.user?.id || null)
      } catch { setUserId(null) }
    })()
  }, [])

  // load videos (lightweight fields)
  useEffect(() => {
    ;(async () => {
      try {
        let query = supabase
          .from("videos")
          .select("id, owner_id, storage_path")
          .order("created_at", { ascending: false })
        if (onlyMine && userId) query = query.eq("owner_id", userId)
        const { data, error } = await query
        if (error) throw error
        setVideos((data || []) as V[])
        setTotal((data || []).length)
      } catch {
        setVideos([])
        setTotal(0)
      }
    })()
  }, [onlyMine, userId])

  const runCheck = async () => {
    setChecking(true)
    setMissing([])
    setHave(0)
    cancelRef.current = false
    try {
      for (let i = 0; i < videos.length; i++) {
        if (cancelRef.current) break
        const v = videos[i]
        const posterKey = derivePosterKey(v.storage_path || "")
        if (!posterKey) continue
        const { data } = supabase.storage.from("videos").getPublicUrl(posterKey)
        const ok = await headExists(data.publicUrl)
        if (ok) setHave((h) => h + 1)
        else setMissing((m) => [...m, { id: v.id, posterKey }])
        // small yield to keep UI responsive
        if (i % 20 === 0) await new Promise((r) => setTimeout(r, 0))
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <h1 className="text-lg font-semibold mb-4">サムネイル存在チェック</h1>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> 自分の動画のみ
        </label>
        {!checking ? (
          <button
            disabled={total === 0}
            onClick={runCheck}
            className={`px-4 py-2 rounded ${total === 0 ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            チェック実行
          </button>
        ) : (
          <>
            <span className="text-sm text-gray-600">チェック中…</span>
            <button onClick={() => (cancelRef.current = true)} className="px-3 py-2 rounded bg-gray-200">
              停止
            </button>
          </>
        )}
      </div>

      <div className="text-sm text-gray-700 mb-2">対象: {total} 件</div>
      <div className="text-sm text-green-700 mb-2">存在: {have} 件</div>
      <div className="text-sm text-red-700 mb-4">不足: {missing.length} 件</div>

      {missing.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">不足一覧</h2>
          <ul className="text-xs bg-gray-50 rounded p-2 max-h-64 overflow-auto border">
            {missing.map((m) => (
              <li key={m.id} className="mb-1">
                <code className="bg-gray-100 px-1 py-0.5 rounded">{m.id}</code> — {m.posterKey}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

