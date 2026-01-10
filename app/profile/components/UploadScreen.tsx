"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import VideoUploader from "@/components/uploader/VideoUploader"

interface UploadScreenProps {
  onClose: () => void
}

export function UploadScreen({ onClose }: UploadScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">コンテンツをアップロード</h1>
      </div>
      <div className="px-6 py-4">
        <VideoUploader />
      </div>
    </div>
  )
}

