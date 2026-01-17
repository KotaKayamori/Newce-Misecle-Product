"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { Bell } from "lucide-react"

interface NotificationPermissionScreenProps {
  onClose: () => void
  onEnable: () => Promise<void>
}

export function NotificationPermissionScreen({ onClose, onEnable }: NotificationPermissionScreenProps) {
  const handleEnableNotifications = async () => {
    await onEnable()
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">プッシュ通知を有効にする</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-12 h-12 text-orange-600" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">通知を有効にしますか？</h2>
            <p className="text-gray-600 leading-relaxed">
              以下のような通知を受け取ることができます：
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">予約のリマインダー</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">キャンセル待ちの空席情報</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">新着のおすすめ店舗</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">フォロー中のユーザーの投稿</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleEnableNotifications}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            >
              通知を有効にする
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full py-3 text-lg font-semibold"
            >
              後で設定する
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            ※ 通知設定はいつでも変更できます
          </p>
        </div>
      </div>
    </div>
  )
}

