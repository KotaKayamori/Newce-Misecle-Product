"use client"

import { useCallback, useRef, useState } from "react"
import { useVideoUpload, type VideoCategory } from "@/hooks/useVideoUpload"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload as UploadIcon } from "lucide-react"

const CATEGORY_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: "today_recommended", label: "今日のおすすめ" },
  { value: "popular_now", label: "今人気のお店" },
  { value: "sns_popular", label: "SNSで人気のお店" },
  { value: "gen_z_popular", label: "Z世代に人気のお店" },
  { value: "date_recommended", label: "デートでおすすめのお店" },
]

export default function VideoUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { state, error, publicUrl, upload, reset } = useVideoUpload()
  const [fileName, setFileName] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<VideoCategory | "">("")
  const [caption, setCaption] = useState("")

  const pickFile = () => inputRef.current?.click()

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files?.[0]
    if (f) {
      setFileName(f.name)
      setSelectedFile(f)
    }
  }, [])

  const doUpload = async () => {
    if (!selectedFile) return
    const baseName = selectedFile.name.replace(/\.[^.]+$/, "")
    const derivedTitle = (title || "").trim() || baseName
    await upload(selectedFile, { 
      title: derivedTitle, 
      category: category as VideoCategory,
      caption: (caption || "").trim() || undefined 
    })
  }

  const handleReset = () => {
    reset()
    setFileName("")
    setSelectedFile(null)
    setTitle("")
    setCategory("")
    setCaption("")
  }

  const isFormValid = title.trim() && category && selectedFile

  return (
    <div className="max-w-md w-full mx-auto">
      <Card className="border-0 shadow-none">
        <CardContent className="pt-6 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* 動画タイトル */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              動画タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="動画のタイトルを入力してください"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* 振り分けカテゴリ */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VideoCategory)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">カテゴリを選択してください</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 動画の説明 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              店舗情報 / 感想・レビュー（任意）
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="お店についての情報やレビュー（任意）"
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* 動画ファイルアップロード */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              動画ファイル <span className="text-red-500">*</span>
            </label>
            <div
              className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                dragOver ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={pickFile}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFiles(e.dataTransfer.files)
              }}
            >
              <div className="flex flex-col items-center gap-2">
                {state === "uploading" ? (
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                ) : (
                  <UploadIcon className="w-6 h-6 text-gray-600" />
                )}
                <p className="text-sm text-gray-700">
                  {fileName || (dragOver ? "ここにドロップ" : "クリックまたはドラッグ＆ドロップで選択")}
                </p>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    pickFile()
                  }}
                  disabled={state === "uploading"}
                  className="mt-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full"
                >
                  ファイルを選択
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">mp4 / webm / mov（上限100MB）</p>
          </div>

          {/* エラー表示 */}
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

          {/* アップロードボタン */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={doUpload}
              disabled={state === "uploading" || !isFormValid}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full disabled:bg-gray-300 disabled:text-gray-500"
            >
              {state === "uploading" ? "アップロード中…" : "アップロードする"}
            </Button>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={state === "uploading"}
              className="px-6"
            >
              リセット
            </Button>
          </div>

          {/* 成功時のプレビュー */}
          {publicUrl && (
            <div className="space-y-3 bg-green-50 p-4 rounded-md border border-green-200">
              <p className="text-sm text-green-700 font-medium">✓ アップロード完了</p>
              {/* <div className="space-y-2">
                <p className="text-sm font-medium">タイトル: {title}</p>
                <p className="text-sm">カテゴリ: {CATEGORY_OPTIONS.find(opt => opt.value === category)?.label}</p>
                <video src={publicUrl} controls className="w-full rounded max-h-40" />
              </div> */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
