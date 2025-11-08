"use client"

import { Button } from "@/components/ui/button"

interface LogoutConfirmScreenProps {
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function LogoutConfirmScreen({ onClose, onConfirm }: LogoutConfirmScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto">
        <h2 className="text-xl font-semibold mb-4">ログアウト確認</h2>
        <p className="text-gray-600 mb-6">本当にログアウトしますか？</p>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            ログアウト
          </Button>
        </div>
      </div>
    </div>
  )
}

