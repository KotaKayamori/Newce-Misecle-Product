"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import MyVideosPanel from "@/components/my-videos/MyVideosPanel"

export default function MyVideosPage() {
  return (
    <div className="min-h-screen bg-white pb-20 px-6 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">自分の動画</h1>
        <Button onClick={() => (window.location.href = "/upload")} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full">
          アップロード
        </Button>
      </div>

      <MyVideosPanel />
      <Navigation />
    </div>
  )
}
