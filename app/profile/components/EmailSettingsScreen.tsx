"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface EmailSettingsScreenProps {
  onClose: () => void
}

export function EmailSettingsScreen({ onClose }: EmailSettingsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">お知らせメール設定</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-4">
          <p className="text-gray-600">
            登録すると期間限定のキャンペーン情報やお得なクーポン情報など、ミセクルのサービスに関する案内などをメールで受け取ることができます。
          </p>

          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <p className="text-gray-800 font-medium">登録中のメールアドレス</p>
            <p className="text-gray-600">未登録</p>
          </div>

          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            お知らせが配信されることに同意してメールアドレスを登録
          </Button>
        </div>
      </div>
    </div>
  )
}

