"use client"

import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase"

type UploadState = "idle" | "uploading" | "success" | "error"

export type VideoCategory = 
  | "today_recommended" 
  | "popular_now" 
  | "sns_popular" 
  | "gen_z_popular" 
  | "date_recommended"

export type VideoMeta = {
  title: string
  category: VideoCategory
  caption?: string
}

export function useVideoUpload() {
  const [state, setState] = useState<UploadState>("idle")
  const [error, setError] = useState<string>("")
  const [publicUrl, setPublicUrl] = useState<string>("")
  const [path, setPath] = useState<string>("")

  const upload = useCallback(async (file: File, meta: VideoMeta) => {
    setError("")
    setPublicUrl("")
    setPath("")

    if (!file) {
      setError("ファイルが選択されていません")
      setState("error")
      return
    }
    if (!file.type || !file.type.startsWith("video/")) {
      setError("動画ファイルを選択してください（mp4, webm など）")
      setState("error")
      return
    }

    if (!meta.title?.trim()) {
      setError("動画タイトルを入力してください")
      setState("error")
      return
    }

    if (!meta.category) {
      setError("振り分けカテゴリを選択してください")
      setState("error")
      return
    }

    // 100MB 目安（必要に応じて変更）
    const MAX = 100 * 1024 * 1024
    if (file.size > MAX) {
      setError("ファイルサイズが大きすぎます（上限100MB）")
      setState("error")
      return
    }

    setState("uploading")
    try {
      // Attach Supabase session token for server to identify user
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error("アップロードにはログインが必要です")
      }

      const res = await fetch("/api/videos/create-signed-upload", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `サイン発行に失敗しました (${res.status})`)
      }

      const { bucket, path, token, cacheControl } = await res.json()
      if (!bucket || !path || !token) {
        throw new Error("アップロード情報の取得に失敗しました")
      }

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          cacheControl: cacheControl || "31536000",
          upsert: false,
        })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
      setPublicUrl(pub.publicUrl)
      setPath(path)

      // Save metadata to server (videos table) and keep user_videos for migration
      try {
        const body = {
          path,
          publicUrl: pub.publicUrl,
          title: meta.title.trim(),
          category: meta.category,
          caption: meta.caption?.trim() || undefined,
        }
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        const res = await fetch("/api/videos/commit", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          // non-fatal: keep UI success, but record error message
          const j = await res.json().catch(() => ({}))
          console.warn("commit failed", res.status, j?.error)
        }
      } catch (e) {
        console.warn("commit error", e)
      }

      setState("success")
    } catch (e: any) {
      setError(e?.message || "アップロードに失敗しました")
      setState("error")
    }
  }, [])

  const reset = useCallback(() => {
    setState("idle")
    setError("")
    setPublicUrl("")
    setPath("")
  }, [])

  return { state, error, publicUrl, path, upload, reset }
}
