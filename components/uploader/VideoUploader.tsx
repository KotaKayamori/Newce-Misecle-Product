"use client"

import { useCallback, useRef, useState } from "react"
import { useVideoUpload } from "@/hooks/useVideoUpload"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Upload as UploadIcon } from "lucide-react"

export default function VideoUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { state, error, publicUrl, upload, reset } = useVideoUpload()
  const [fileName, setFileName] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

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
    await upload(selectedFile, { title: derivedTitle, description: (description || "").trim() || undefined })
  }

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

          {/* Title / Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full border rounded px-3 py-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明（任意）"
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>

          {/* Drag & Drop zone */}
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
                className="mt-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs"
              >
                ファイルを選択
              </Button>
            </div>
          </div>

          {/* Upload button (outside of dotted area) */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={doUpload}
              disabled={state === "uploading" || !selectedFile}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full"
            >
              {state === "uploading" ? "アップロード中…" : "アップロードする"}
            </Button>
          </div>


          {/* Error */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setFileName("")
                setSelectedFile(null)
                setTitle("")
                setDescription("")
              }}
            >
              取消
            </Button>
            <span className="text-xs text-gray-500">mp4 / webm / mov（上限100MB）</span>
          </div>

          {/* Success preview */}
          {publicUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">アップロード完了。プレビュー:</p>
              <video src={publicUrl} controls className="w-full rounded" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
