"use client"

import VideoUploader from "@/components/uploader/VideoUploader"
import Navigation from "@/components/navigation"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <h1 className="text-xl font-semibold mb-4">コンテンツをアップロード</h1>
      <VideoUploader />
      <Navigation />
    </div>
  )
}

