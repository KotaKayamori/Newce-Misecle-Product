"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface VisitedStoresScreenProps {
  onClose: () => void
}

export function VisitedStoresScreen({ onClose }: VisitedStoresScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">これまで来店した店舗一覧</h1>
      </div>

      <div className="px-6 py-4">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">これまで来店した店舗はありません</p>
          <p className="text-xs text-gray-400">来店後に店舗名が表示されます</p>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

