"use client"

import VideoUploader from "@/components/uploader/VideoUploader"
import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8 overflow-x-hidden">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/search")}
          className="text-black"
          aria-label="検索に戻る"
        >
          ＜
        </Button>
        <h1 className="text-xl font-semibold">コンテンツをアップロード</h1>
      </div>

      <VideoUploader />
    </div>
  )
}
