"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"

interface FAQScreenProps {
  onClose: () => void
}

const faqData = [
  {
    question: "Q1.Misecle（ミセクル）ってどんなサービスですか？",
    answer: "A1.ショート動画型のグルメ予約サービスです。ショート動画で、お店の雰囲気や料理のメニューなどを確認し、行きたい飲食店とマッチングできるサービスです。",
  },
  {
    question: "Q2.どうやってお店を探せますか？",
    answer: "A2.店舗名検索やショート動画で直感的に探せます。ジャンルや場所での絞り込み検索も可能です。",
  },
  {
    question: "Q3.予約は無料ですか？",
    answer: "A3.はい。アプリ内の予約は無料です。キャンセルもアプリ上から簡単に行えます。",
  },
  {
    question: "Q4.誰でも利用できますか？",
    answer: "A4.はい。大学生などZ世代を中心にどなたでもご利用いただけます。今後、一部キャンペーンや招待制機能なども追加予定です。",
  },
  {
    question: "Q5.お店の動画は誰が投稿していますか？",
    answer: "A5.インフルエンサーや一般のユーザーが投稿しています。気に入ったお店や美味しかった料理を共有できます。",
  },
  {
    question: "Q6.予約をキャンセルしたい",
    answer: "A6.「予約」タブから該当の予約を選択し、キャンセルボタンを押してください。",
  },
]

export function FAQScreen({ onClose }: FAQScreenProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">よくある質問</h1>
      </div>

      <div className="px-6 py-4 space-y-4">
        {faqData.map((faq, index) => (
          <div key={index} className="border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => toggleExpand(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">{faq.question}</span>
              <span className="text-gray-500">{expandedIndex === index ? "−" : "＋"}</span>
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4 text-gray-700 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <Navigation />
    </div>
  )
}

