"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Navigation from "@/components/navigation"

interface PasswordSuccessScreenProps {
  onClose: () => void
}

export function PasswordSuccessScreen({ onClose }: PasswordSuccessScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="flex flex-col items-center justify-center h-screen px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">パスワード変更完了</h2>
        <p className="text-gray-600 text-center mb-6">
          パスワードが正常に変更されました。
          <br />
          次回ログイン時は新しいパスワードをご使用ください。
        </p>
        <Button
          onClick={onClose}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold"
        >
          閉じる
        </Button>
      </div>
    </div>
  )
}

