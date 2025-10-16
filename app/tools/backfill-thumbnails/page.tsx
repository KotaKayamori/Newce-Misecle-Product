"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type V = { id: string; owner_id: string; playback_url: string; storage_path: string | null }

// ---- 共通ユーティリティ ----
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`TIMEOUT_${ms}ms`)), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

function derivePosterPath(storagePath: string): string {
  let s = storagePath || ""
  try { s = decodeURIComponent(s) } catch {}
  try { s = decodeURIComponent(s) } catch {}
  s = s
    .replace(/^https?:\/\/[^]+?\/object\/(public|sign)\/videos\//, "")
    .replace(/^videos\//, "")
    .replace(/^\/+/, "")
  if (!s || s.includes("..")) throw new Error("invalid storage_path")
  return s.replace(/\.[^.]+$/, ".webp")
}

function normalizeStoragePath(storagePath: string): string {
  let s = storagePath || ""
  try { s = decodeURIComponent(s) } catch {}
  try { s = decodeURIComponent(s) } catch {}
  return s
    .replace(/^https?:\/\/[^]+?\/object\/(public|sign)\/videos\//, "")
    .replace(/^videos\//, "")
    .replace(/^\/+/, "")
}

// ---- 抽出：タイムアウト5s、画質据え置き（720px / q=0.8）----
const POSTER_TIMEOUT_MS = 5000
async function extractPosterFromUrl(url: string, t = 0.2, timeoutMs = POSTER_TIMEOUT_MS): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    const video = document.createElement("video")
    let settled = false
    const finish = (b: Blob | null) => {
      if (settled) return
      settled = true
      try { video.pause() } catch {}
      try { video.removeAttribute("src"); video.load() } catch {}
      resolve(b)
    }

    const timer = setTimeout(() => {
      console.warn("⏳ extractPoster timeout -> skip", url)
      finish(null)
    }, timeoutMs)

    video.preload = "metadata"
    video.crossOrigin = "anonymous"
    video.muted = true
    video.playsInline = true
    video.src = url.includes("#t=") ? url : `${url}#t=${t}`

    video.onloadedmetadata = () => {
      const dur = Math.max(0.2, video.duration || 1)
      const seek = Math.min(Math.max(0.1, t), dur - 0.05)
      try { video.currentTime = seek } catch {}
    }
    video.onseeked = () => {
      try {
        const maxW = 720 // ★据え置き
        const vw = video.videoWidth || maxW
        const vh = video.videoHeight || Math.round((maxW * 16) / 9)
        const r = Math.min(1, maxW / vw)
        const w = Math.round(vw * r), h = Math.round(vh * r)
        const canvas = document.createElement("canvas")
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(video, 0, 0, w, h)
        canvas.toBlob((b) => { clearTimeout(timer); finish(b) }, "image/webp", 0.8) // ★据え置き
      } catch {
        clearTimeout(timer)
        finish(null)
      }
    }
    video.onerror = () => { clearTimeout(timer); finish(null) }
  })
}

// ---- 原因特定：HEADで軽診断（重さ/Range有無/ステータス）----
async function diagnoseHead(url: string): Promise<{ len?: number; range?: string; status?: number }> {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" })
    return {
      len: Number(r.headers.get("content-length") || 0),
      range: (r.headers.get("accept-ranges") || "").toLowerCase(),
      status: r.status,
    }
  } catch {
    return {}
  }
}

// クライアント: FAST失敗時はサーバへ委譲（5s→サーバ30s）
async function serverPosterFallback(playbackUrl: string, posterPath: string) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch("/api/tools/extract-poster", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ playbackUrl, posterPath, t: 0.6 }),
  })
  if (!res.ok) throw new Error(`SERVER_EXTRACT_${res.status}`)
  return res.json() as Promise<{ ok: boolean; existed?: boolean }>
}

// ---- 追加: fetchにタイムアウトをかけるヘルパ ----
function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

// ---- 追加: フルBlob抽出（フォールバック専用 / 画質据え置き）----
async function extractPosterFromBlobFallback(url: string): Promise<Blob | null> {
  try {
    const resp = await fetchWithTimeout(url, { cache: "no-store" }, 25000)
    if (!resp.ok) return null
    const videoBlob = await resp.blob()
    if (!videoBlob || videoBlob.size < 1000) return null

    return await new Promise<Blob | null>((resolve) => {
      const blobUrl = URL.createObjectURL(videoBlob)
      const video = document.createElement("video")
      let settled = false
      const finish = (b: Blob | null) => {
        if (settled) return
        settled = true
        try { video.pause() } catch {}
        try { video.removeAttribute("src"); video.load() } catch {}
        try { URL.revokeObjectURL(blobUrl) } catch {}
        resolve(b)
      }

      video.preload = "auto"
      video.muted = true
      video.playsInline = true
      video.src = blobUrl

      video.onloadeddata = () => {
        try {
          const maxW = 720
          const vw = video.videoWidth || maxW
          const vh = video.videoHeight || Math.round((maxW * 16) / 9)
          const r = Math.min(1, maxW / vw)
          const w = Math.round(vw * r), h = Math.round(vh * r)
          const canvas = document.createElement("canvas")
          canvas.width = w; canvas.height = h
          canvas.getContext("2d")!.drawImage(video, 0, 0, w, h)
          canvas.toBlob((b) => finish(b), "image/webp", 0.8)
        } catch { finish(null) }
      }
      video.onerror = () => finish(null)

      // 安全タイマ：読み込みが遅すぎる個体対策（20s）
      setTimeout(() => finish(null), 20000)
    })
  } catch {
    return null
  }
}

// ---- サーバ経由アップロード（CORS/プリフライト回避 & 8s timeout）----
async function uploadPosterViaApi(posterPath: string, blob: Blob): Promise<{ existed: boolean }> {
  let authHeaders: Record<string, string> = {}
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) authHeaders = { Authorization: `Bearer ${session.access_token}` }
  } catch {}

  const res: Response = await withTimeout(
    fetch("/api/tools/upload-poster", {
      method: "POST",
      headers: { "content-type": "application/octet-stream", "x-poster-path": posterPath, ...authHeaders },
      body: blob,
    }),
    8000,
  )
  const text = await res.text().catch(() => "")
  if (res.ok) {
    try { return JSON.parse(text) as { existed: boolean } } catch { return { existed: false } }
  }
  throw new Error(`UPLOAD_${res.status}${text ? ` ${text}` : ""}`)
}

export default function BackfillThumbnailsPage() {
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState<V[]>([])
  const [done, setDone] = useState(0)
  const [created, setCreated] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [failed, setFailed] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)

  const [failList, setFailList] = useState<{ id: string; reason: string }[]>([])
  const runningRef = useRef(false)
  const cancelRef = useRef(false)

  // Supabase の全動画を取得（生成・アップロードにはログインが必要）
  useEffect(() => {
    ;(async () => {
      try {
        let me: string | null = null
        try {
          const { data: sess } = await supabase.auth.getSession()
          me = sess.session?.user?.id || null
        } catch {}
        if (!me) {
          const { data: u } = await supabase.auth.getUser()
          me = u.user?.id || null
        }
        setNeedLogin(!me)

        const { data, error } = await supabase
          .from("videos")
          .select("id, owner_id, playback_url, storage_path, created_at")
          .order("created_at", { ascending: false })
        if (error) throw error
        setVideos((data || []) as V[])
      } catch (e) {
        console.warn("load videos failed", e)
        setVideos([])
      }
    })()
  }, [])

  const total = videos.length

  // 既存 .webp 判定：HEADは環境で400になり得るため list() に寄せる（堅牢）
  async function posterExists(posterPath: string) {
    try {
      const folder = posterPath.split("/").slice(0, -1).join("/")
      const file = posterPath.split("/").pop()
      const { data: listed } = await supabase.storage.from("videos").list(folder, { limit: 1, search: file })
      return !!listed?.find((f: any) => f.name === file)
    } catch { return false }
  }

  // 1件処理
  async function processOne(v: V) {
    const storagePath = (v.storage_path || "").trim()
    if (!storagePath) throw new Error("storage_path が空です")

    const posterPath = derivePosterPath(storagePath)

    // --- ① 既存 .webp の存在チェック ---
    const alreadyExists = await posterExists(posterPath)
    if (alreadyExists) {
      console.info(`[${v.id}] ✅ 既存サムネあり → スキップ`)
      setSkipped((s) => s + 1)
      return
    }

    // --- ② 軽診断（失敗原因見える化） ---
    const diag = await diagnoseHead(v.playback_url)
    if (diag.status && diag.status >= 400) console.warn(`[${v.id}] HEAD status=${diag.status}`)
    if (diag.len) console.warn(`[${v.id}] size≈${Math.round((diag.len as number) / 1024 / 1024)}MB`)
    if (diag.range && !diag.range.includes("bytes")) console.warn(`[${v.id}] no Accept-Ranges (seek不安定の可能性)`)

    // --- ③ 抽出（5秒打ち切り）→ 失敗時はサーバ委譲（30s想定） ---
    let posterBlob = await extractPosterFromUrl(v.playback_url, 0.2, POSTER_TIMEOUT_MS)
    if (posterBlob && posterBlob.size >= 100) {
      const up = await uploadPosterViaApi(posterPath, posterBlob)
      if (up?.existed) { setSkipped(s=>s+1) } else { setCreated(c=>c+1) }
      return
    }
    // レース吸収（他タスクで生成済み）
    if (await posterExists(posterPath)) { setSkipped(s=>s+1); return }
    const srv = await serverPosterFallback(v.playback_url, posterPath)
    if (srv.existed) { setSkipped(s=>s+1); return }
    if (srv.ok) { setCreated(c=>c+1); return }
    throw new Error("EXTRACT_TIMEOUT")

    // --- ④ 再チェック（同時生成レース対策） ---
    const existsBeforeUpload = await posterExists(posterPath)
    if (existsBeforeUpload) {
      console.info(`[${v.id}] 🟡 他スレッドで既に生成済み → スキップ`)
      setSkipped((s) => s + 1)
      return
    }

    // --- ⑤ アップロード（8s timeout / 409→スキップ扱い） ---
    try {
      const result = await uploadPosterViaApi(posterPath, posterBlob)
      if (result?.existed) {
        console.info(`[${v.id}] ⚪️ 既存ファイル → スキップ扱い`)
        setSkipped((s) => s + 1)
        return
      }
      console.info(`[${v.id}] ✅ アップロード完了`)
      setCreated((c) => c + 1)
    } catch (e: any) {
      const msg = e?.message || ""
      // 409 or duplicate → スキップ扱い
      if (msg.includes("409") || msg.toLowerCase().includes("duplicate")) {
        console.info(`[${v.id}] ⚪️ 既存ファイル → スキップ扱い`)
        setSkipped((s) => s + 1)
        return
      }
      throw e
    }
  }

  async function run(target?: V[]) {
    if (needLogin) {
      alert("サムネイル生成にはログインが必要です。先にログインしてください。")
      return
    }
    if (runningRef.current) return
    runningRef.current = true
    setLoading(true)
    setStopped(false)
    cancelRef.current = false
    setDone(0); setCreated(0); setSkipped(0); setFailed(0)
    setFailList([])

    try {
      const list = target ?? videos
      for (let i = 0; i < list.length; i++) {
        if (cancelRef.current) { setStopped(true); break }
        const v = list[i]
        try {
          await processOne(v)
        } catch (e: any) {
          const msg = e?.message || String(e)
          // 失敗理由を1行で正規化
          let reason = "UNKNOWN"
          if (msg.includes("EXTRACT_TIMEOUT")) reason = "EXTRACT_TIMEOUT"
          else if (msg.startsWith("UPLOAD_")) reason = msg // UPLOAD_4xx/5xx or TIMEOUT_8000ms
          else if (msg.startsWith("TIMEOUT_")) reason = msg
          console.warn(`[${v.id}] FAIL ${reason}`)
          setFailed(f => f + 1)
          setFailList(prev => [...prev, { id: v.id, reason }])
        } finally {
          setDone(d => d + 1)
          await new Promise(r => setTimeout(r, 30))
        }
      }
    } finally {
      runningRef.current = false
      setLoading(false)
    }
  }

  async function retryOne(videoId: string) {
    const v = videos.find(x => x.id === videoId)
    if (!v) return alert("対象動画が見つかりません")
    try {
      await processOne(v)
      setFailList(prev => prev.filter(f => f.id !== videoId))
      setCreated(c => c + 1)
    } catch (e: any) {
      alert(`再実行失敗: ${e?.message || e}`)
    }
  }

  async function retryFailed() {
    const targets = videos.filter(v => failList.some(f => f.id === v.id))
    await run(targets)
  }

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <h1 className="text-xl font-bold mb-2">サムネイル一括生成（全動画対象）</h1>
      <p className="text-xs text-gray-600 mb-4">
        既存サムネはStorageのlistで検出しスキップ。失敗IDは記録され、個別/一括で再実行できます。
      </p>

      <div className="text-sm text-gray-700 mb-3">
        対象動画数: {total}{needLogin ? "（ログインが必要です）" : ""}
      </div>

      <div className="flex items-center gap-3 mb-4">
        {!loading ? (
          <>
            <button
              disabled={total === 0}
              onClick={() => run()}
              className={`px-4 py-2 rounded ${total === 0 ? "bg-gray-300 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              生成を開始
            </button>
            {failList.length > 0 && (
              <button
                onClick={retryFailed}
                className="px-3 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
              >
                失敗分だけ再実行（{failList.length}件）
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-sm text-gray-600">実行中…</span>
            <button
              onClick={() => { cancelRef.current = true }}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              停止
            </button>
          </>
        )}
      </div>

      <div className="text-sm text-gray-700">進捗: {done}/{total} {stopped ? "(停止)" : ""}</div>
      <div className="text-sm text-green-700">作成: {created}</div>
      <div className="text-sm text-gray-700">スキップ: {skipped}</div>
      <div className="text-sm text-red-700">失敗: {failed}</div>

      {failList.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-2">失敗一覧</h2>
          <ul className="text-xs bg-gray-50 rounded p-2 max-h-40 overflow-auto border">
            {failList.map((f) => (
              <li key={f.id} className="mb-1">
                <code className="bg-gray-100 px-1 py-0.5 rounded">{f.id}</code>{" "}
                — {f.reason}
                <button
                  className="ml-2 text-blue-600 underline"
                  onClick={() => retryOne(f.id)}
                >
                  再実行
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
