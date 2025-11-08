"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface EmailSuccessScreenProps {
  onClose: () => void
  message: string
  type: "contact" | "bug"
}

export function EmailSuccessScreen({ onClose, message, type }: EmailSuccessScreenProps) {
  const title = type === "contact" ? "お問い合わせ送信完了" : "不具合・改善要望送信完了"

  return (
    <div className="min-h-screen bg-white pb-20 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
        <Button
          onClick={onClose}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
        >
          閉じる
        </Button>
      </div>
    </div>
  )
}

