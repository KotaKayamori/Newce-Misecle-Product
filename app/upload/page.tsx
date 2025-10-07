"use client"

import VideoUploader from "@/components/uploader/VideoUploader"
import Navigation from "@/components/navigation"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <h1 className="text-xl font-semibold mb-4">動画アップロード</h1>
      <p className="text-sm text-gray-600 mb-6">mp4 / webm / mov 推奨。上限 100MB（開発設定）。</p>
      <VideoUploader />
      <Navigation />
    </div>
  )
}

