"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface MutedStoresSettingsScreenProps {
  onClose: () => void
}

export function MutedStoresSettingsScreen({ onClose }: MutedStoresSettingsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">ミュートにしている店舗</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">ミュートにしている店舗はありません</h2>
          <p className="text-sm text-gray-600">
            ミュートした店舗からは通知が届かなくなり、クーポン情報や取得したクーポンなどの利用もできなくなります。
          </p>
        </div>
      </div>
    </div>
  )
}

