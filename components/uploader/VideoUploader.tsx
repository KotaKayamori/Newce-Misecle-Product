"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload as UploadIcon, Trash2 } from "lucide-react"
import { useVideoUpload, type VideoCategory } from "@/hooks/useVideoUpload"
import { supabase } from "@/lib/supabase"

type UploadMode = "" | "video" | "album"

const CATEGORY_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: "today_recommended", label: "今日のおすすめ" },
  { value: "popular_now", label: "今人気のお店" },
  { value: "sns_popular", label: "SNSで人気のお店" },
  { value: "gen_z_popular", label: "Z世代に人気のお店" },
  { value: "date_recommended", label: "デートでおすすめのお店" },
]

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

type PhotoUploadState = "idle" | "uploading" | "success" | "error"

export default function VideoUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { state, error, publicUrl, upload, reset } = useVideoUpload()

  const [mode, setMode] = useState<UploadMode>("")
  const [formatError, setFormatError] = useState("")

  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<VideoCategory | "">("")
  const [caption, setCaption] = useState("")

  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoError, setPhotoError] = useState("")
  const [photoState, setPhotoState] = useState<PhotoUploadState>("idle")
  const [photoResult, setPhotoResult] = useState<string[]>([])
  const [albumId, setAlbumId] = useState<string | null>(null)

  const pickFile = () => {
    if (!mode) {
      setFormatError("形式を選択してください")
      return
    }
    inputRef.current?.click()
  }

  const handleVideoFiles = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setSelectedFile(file)
  }, [])

  const handlePhotoFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const accepted = Array.from(files).filter((file) =>
      IMAGE_MIME_TYPES.includes(file.type.toLowerCase()),
    )
    if (!accepted.length) return
    setPhotoFiles((prev) => [...prev, ...accepted])
  }, [])

  const removePhotoFile = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const resetVideo = () => {
    reset()
    setSelectedFile(null)
  }

  const resetPhoto = () => {
    setPhotoFiles([])
    setPhotoState("idle")
    setPhotoError("")
    setPhotoResult([])
    setAlbumId(null)
  }

  const handleModeChange = (value: UploadMode) => {
    setMode(value)
    setFormatError("")
    if (value === "video") {
      resetPhoto()
    } else if (value === "album") {
      resetVideo()
      setCategory("")
    } else {
      resetVideo()
      resetPhoto()
      setCategory("")
    }
  }

  useEffect(() => {
    const preventWindowDrop = (event: DragEvent) => {
      const hasFiles = Array.from(event.dataTransfer?.types ?? []).includes("Files")
      if (!hasFiles) return
      event.preventDefault()
    }

    window.addEventListener("dragover", preventWindowDrop)
    window.addEventListener("drop", preventWindowDrop)

    return () => {
      window.removeEventListener("dragover", preventWindowDrop)
      window.removeEventListener("drop", preventWindowDrop)
    }
  }, [])

  const doVideoUpload = async () => {
    if (!selectedFile || !category) return
    if (!selectedFile.type.startsWith("video/")) {
      setFormatError("動画ファイルを選択してください")
      return
    }
    if (selectedFile.size > MAX_VIDEO_BYTES) {
      setFormatError("ファイルサイズが大きすぎます（上限100MB）")
      return
    }
    await upload(selectedFile, {
      title: title.trim(),
      category: category as VideoCategory,
      caption: caption.trim() || undefined,
      uploadKind: "video",
    })
  }

  const doPhotoUpload = async () => {
    setPhotoError("")
    setPhotoResult([])

    if (!photoFiles.length) {
      setPhotoError("アップロードする写真を選択してください")
      setPhotoState("error")
      return
    }
    if (!title.trim()) {
      setPhotoError("タイトルを入力してください")
      setPhotoState("error")
      return
    }

    setPhotoState("uploading")
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error("アップロードにはログインが必要です")

      let activeAlbumId = albumId
      if (!activeAlbumId) {
        const createAlbumRes = await fetch("/api/guidebook/albums", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: caption.trim() || null,
            visibility: "public",
          }),
        })
        if (!createAlbumRes.ok) {
          const payload = await createAlbumRes.json().catch(() => ({}))
          throw new Error(payload?.error || "アルバムの作成に失敗しました")
        }
        const payload = await createAlbumRes.json()
        activeAlbumId = payload?.album?.id
        if (!activeAlbumId) throw new Error("アルバムIDの取得に失敗しました")
        setAlbumId(activeAlbumId)
      }

      const uploadedPaths: string[] = []

      for (const file of photoFiles) {
        if (!IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
          throw new Error(`${file.name} は対応していないファイル形式です`)
        }
        if (file.size > MAX_IMAGE_BYTES) {
          throw new Error(`${file.name} が大きすぎます（1枚10MB以下推奨）`)
        }

        const signRes = await fetch("/api/guidebook/create-signed-upload", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            albumId: activeAlbumId,
            filename: file.name,
            contentType: file.type,
          }),
        })
        if (!signRes.ok) {
          const payload = await signRes.json().catch(() => ({}))
          throw new Error(payload?.error || `署名付きURLの取得に失敗しました (${file.name})`)
        }

        const { bucket, path, token, cacheControl } = await signRes.json()
        if (!bucket || !path || !token) throw new Error("アップロード情報の取得に失敗しました")

        const { error: storageErr } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(path, token, file, {
            contentType: file.type,
            cacheControl: cacheControl || "31536000",
            upsert: false,
          })
        if (storageErr) throw storageErr

        uploadedPaths.push(path)

        const { error: assetErr } = await supabase.from("photo_assets").insert([
          {
            album_id: activeAlbumId,
            storage_path: path,
            order_index: uploadedPaths.length - 1,
            width: null,
            height: null,
          },
        ])
        if (assetErr) {
          throw new Error(assetErr.message || "写真データの保存に失敗しました")
        }

        if (uploadedPaths.length === 1) {
          await fetch(`/api/guidebook/albums/${activeAlbumId}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ coverPath: path }),
          }).catch(() => {})
        }
      }

      setPhotoResult(uploadedPaths)
      setPhotoState("success")
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const channel = new BroadcastChannel("guidebook-updates")
          channel.postMessage({
            type: "album-uploaded",
            albumId: activeAlbumId,
            timestamp: Date.now(),
          })
          channel.close()
        } catch (broadcastErr) {
          console.error("guidebook broadcast error", broadcastErr)
        }
      }
    } catch (err: any) {
      console.error("photo upload error", err)
      setPhotoError(err?.message || "写真のアップロードに失敗しました")
      setPhotoState("error")
    }
  }

  const handleSubmit = async () => {
    if (!mode) {
      setFormatError("形式を選択してください")
      return
    }
    if (!title.trim()) {
      setFormatError("タイトルを入力してください")
      return
    }
    if (mode === "video") {
      if (!category) {
        setFormatError("カテゴリを選択してください")
        return
      }
      await doVideoUpload()
    } else if (mode === "album") {
      await doPhotoUpload()
    }
  }

  const handleResetForm = () => {
    setMode("")
    setFormatError("")
    resetVideo()
    resetPhoto()
    setTitle("")
    setCategory("")
    setCaption("")
  }

  const isVideoMode = mode === "video"
  const isAlbumMode = mode === "album"

  const isUploading = isVideoMode ? state === "uploading" : photoState === "uploading"
  const isValid =
    isVideoMode
      ? Boolean(title.trim() && category && selectedFile)
      : isAlbumMode
        ? Boolean(title.trim() && photoFiles.length > 0)
        : false

  const uploadButtonLabel = isUploading
    ? "アップロード中…"
    : isVideoMode
      ? "動画をアップロードする"
      : isAlbumMode
        ? "写真をアップロードする"
        : "アップロードする"

  return (
    <div className="mx-auto w-full min-h-0 max-w-md">
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-4 pt-6">
          <input
            ref={inputRef}
            type="file"
            accept={
              mode === "album"
                ? IMAGE_MIME_TYPES.join(",")
                : mode === "video"
                  ? "video/mp4,video/webm,video/quicktime"
                  : ""
            }
            multiple={mode === "album"}
            className="hidden"
            onChange={(e) => {
              if (mode === "album") handlePhotoFiles(e.target.files)
              else handleVideoFiles(e.target.files)
            }}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              形式を選択 <span className="text-red-500">*</span>
            </label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as UploadMode)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">形式を選択してください</option>
              <option value="video">動画</option>
              <option value="album">アルバム</option>
            </select>
            {formatError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {formatError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力してください"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VideoCategory)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
              required={!isAlbumMode}
              disabled={isAlbumMode}
            >
              <option value="">カテゴリを選択してください</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isAlbumMode && (
              <p className="text-xs text-gray-500">アルバムではカテゴリ選択は不要です</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">店舗情報 / 感想・レビュー（任意）</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="お店についての情報やレビュー（任意）"
              className="w-full rounded-md border border-gray-300 px-3 py-2 h-24 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isAlbumMode ? "写真ファイル" : isVideoMode ? "動画ファイル" : "ファイル"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-gray-400"
              } ${isUploading ? "pointer-events-none opacity-75" : "cursor-pointer"}`}
              onClick={pickFile}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!mode) return
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragOver(false)
                if (!mode) {
                  setFormatError("形式を選択してください")
                  return
                }
                if (mode === "album") handlePhotoFiles(e.dataTransfer.files)
                else handleVideoFiles(e.dataTransfer.files)
              }}
            >
              <div className="flex flex-col items-center gap-3">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                ) : (
                  <UploadIcon className="h-6 w-6 text-gray-600" />
                )}

                {isVideoMode && (
                  <>
                    <p className="text-sm text-gray-700">
                      {selectedFile
                        ? selectedFile.name
                        : dragOver
                          ? "ここにドロップしてください"
                          : "クリックまたはドラッグ＆ドロップで動画を選択"}
                    </p>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        pickFile()
                      }}
                      disabled={isUploading}
                      className="mt-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full"
                    >
                      ファイルを選択
                    </Button>
                  </>
                )}

                {isAlbumMode && (
                  <div className="w-full space-y-3">
                    <p className="text-sm text-gray-700 text-center">
                      {photoFiles.length
                        ? "追加で写真を選択するにはクリックまたはドロップしてください"
                        : dragOver
                          ? "ここにドロップしてください"
                          : "クリックまたはドラッグ＆ドロップで写真を選択（複数可）"}
                    </p>
                    {photoFiles.length > 0 && (
                      <ul className="space-y-2 text-left">
                        {photoFiles.map((file, index) => (
                          <li
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                          >
                            <span className="truncate text-sm font-medium text-gray-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removePhotoFile(index)
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              削除
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {!mode && <p className="text-sm text-gray-600">まず形式を選択してください</p>}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {isAlbumMode
                ? "jpeg / png / webp（1枚10MB以下・複数可）"
                : isVideoMode
                  ? "mp4 / webm / mov（上限100MB）"
                  : ""}
            </p>
            {isVideoMode && error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}
            {isAlbumMode && photoError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{photoError}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isUploading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full disabled:bg-gray-300 disabled:text-gray-500"
            >
              {uploadButtonLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isUploading}
              className="px-6"
            >
              リセット
            </Button>
          </div>

          {isVideoMode && publicUrl && (
            <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">✓ 動画のアップロードが完了しました</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">タイトル: {title}</p>
                <p className="text-sm">
                  カテゴリ: {CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || category}
                </p>
                <video src={publicUrl} controls className="w-full max-h-40 rounded" />
              </div>
            </div>
          )}

          {isAlbumMode && photoState === "success" && photoResult.length > 0 && (
            <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">✓ 写真アルバムのアップロードが完了しました</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {photoResult.map((path, index) => (
                  <li key={`${path}-${index}`} className="truncate">
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
