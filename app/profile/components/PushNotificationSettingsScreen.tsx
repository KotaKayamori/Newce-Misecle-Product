"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface PushNotificationSettingsScreenProps {
  onClose: () => void
}

export function PushNotificationSettingsScreen({ onClose }: PushNotificationSettingsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">プッシュ通知設定</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            ミセクルからの通知を受け取りたくない場合には、端末の通知の設定から、ミセクルアプリの通知をオフにしてください。
          </p>
          <button className="text-blue-600 hover:text-blue-700 transition-colors">通知設定を開く</button>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

