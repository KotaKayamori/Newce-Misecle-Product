"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface LocationSettingsScreenProps {
  onClose: () => void
}

export function LocationSettingsScreen({ onClose }: LocationSettingsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">位置情報の設定</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">ミセクルでの位置情報の取得を許可</h2>
          <p className="text-sm text-gray-600">
            ミセクルアプリでの位置情報の取得を行うには、位置情報アプリの取得を許可してください
          </p>
          <button className="text-blue-600 hover:text-blue-700 transition-colors">位置情報の取得を許可する</button>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

