"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"
import { sendBugReportAction } from "@/app/actions/email-actions"
import { useToast } from "@/hooks/use-toast"

interface BugReportScreenProps {
  onClose: () => void
  onSuccess: (type: "contact" | "bug", message: string) => void
  onShowFAQ: () => void
}

export function BugReportScreen({ onClose, onSuccess, onShowFAQ }: BugReportScreenProps) {
  const { toast } = useToast()
  const [bugSending, setBugSending] = useState(false)

  async function handleBugSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (bugSending) return
    
    const formEl = e.currentTarget
    setBugSending(true)
    
    try {
      const form = new FormData(formEl)
      const message = (form.get("bugMessage") as string) || ""
      
      const res = await sendBugReportAction({ message })
      
      if (res.success) {
        formEl.reset()
        onSuccess(
          "bug",
          "不具合・改善要望を正常に送信いたしました。開発チームが内容を確認し、アプリの改善に活用させていただきます。"
        )
        onClose()
      } else {
        toast({
          title: "送信失敗",
          description: res.error || "エラーが発生しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Bug report error:", error)
      toast({
        title: "送信失敗",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setBugSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-2xl font-semibold">Misecle不具合・改善要望報告フォーム</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-4">
          <p className="text-gray-600">
            アプリの使い方に関しては
            <button
              type="button"
              onClick={() => {
                onClose()
                onShowFAQ()
              }}
              className="text-blue-600 hover:text-blue-700 underline mx-1"
            >
              よくある質問
            </button>
            をご確認ください。
          </p>

          <form onSubmit={handleBugSubmit} className="space-y-4">
            <div className="bg-gray-200 p-6 rounded-lg">
              <div className="bg-white rounded-md">
                <textarea
                  name="bugMessage"
                  rows={8}
                  className="w-full px-4 py-3 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="こちらにご記入ください..."
                  required
                />
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              アプリについてのご意見・ご要望・不具合報告などをお送りください。お問い合わせいただいた内容は、開発チームが確認いたします。
            </p>

            <p className="text-xs text-gray-500 mb-2">※ 不具合・改善要望は support@newce.co.jp に送信されます</p>

            <Button
              type="submit"
              disabled={bugSending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            >
              {bugSending ? "送信中..." : "送信する"}
            </Button>
          </form>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
