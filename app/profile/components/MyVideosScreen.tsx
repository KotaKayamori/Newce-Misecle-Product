"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import MyVideosPanel from "@/components/my-videos/MyVideosPanel"

interface MyVideosScreenProps {
  onClose: () => void
}

export function MyVideosScreen({ onClose }: MyVideosScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">自分の動画</h1>
      </div>
      <div className="px-6 py-4">
        <MyVideosPanel />
      </div>
      <Navigation />
    </div>
  )
}

