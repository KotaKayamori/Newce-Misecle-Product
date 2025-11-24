"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
interface FAQScreenProps {
  onClose: () => void
}

const faqData = [
  {
    question: "Q1.Misecle（ミセクル）ってどんなサービスですか？",
    answer:
      "A1.ショート動画型のグルメ予約サービスです。ショート動画で、お店の雰囲気や料理のメニューなどを確認し、行きたい飲食店とマッチングできるサービスです。",
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
    answer:
      "A4.はい。大学生などZ世代を中心にどなたでもご利用いただけます。今後、一部キャンペーンや招待制機能なども追加予定です。",
  },
  {
    question: "Q5.アプリの利用に会員登録は必要ですか？",
    answer: "A5.はい。無料で新規登録できます。",
  },
  {
    question: "Q6.まだ利用できない機能はありますか？",
    answer:
      "A6.一部機能やポイント機能、お店からのプッシュ通知機能などはまだ未対応です。今後のアップデートで随時追加予定です。",
  },
  {
    question: "Q7.友達と一緒に予約できますか？",
    answer: "A7.はい、予約画面で人数を入力して一緒に予約が可能です。共有リンクで友達にも通知できます。",
  },
  {
    question: "Q8.支払い方法は何がありますか？",
    answer:
      "A8.現在は、店舗での現金・クレジットカード、電子マネー決済などが中心です。アプリ内決済などは今後対応予定です。",
  },
  {
    question: "Q9.店舗情報はどれぐらい正確ですか？",
    answer:
      "A9.現在は、一部情報が中心です。ショート動画による店舗紹介動画で「お店の雰囲気や料理の臨場感」がわかるほか、営業時間など基本的な情報も記載しています。",
  },
  {
    question: "Q10.アプリの不具合や問題があった場合などにはどのようにすれば良いですか？",
    answer:
      "A10.アプリ内の「マイページ」のところの「お問い合わせ」からご連絡ください。サポートチームが順次対応いたします。",
  },
]

export function FAQScreen({ onClose }: FAQScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">Misecle よくある質問（FAQ）</h1>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-0">
          {faqData.map((faq, index) => (
            <div key={index}>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </div>
              {index < faqData.length - 1 && <div className="border-b border-gray-200 mx-4"></div>}
            </div>
          ))}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
