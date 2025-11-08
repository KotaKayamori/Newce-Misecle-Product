"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"
import { sendBugReportAction } from "@/app/actions/email-actions"
import { useToast } from "@/hooks/use-toast"

interface BugReportScreenProps {
  onClose: () => void
  onSuccess: (type: "contact" | "bug", message: string) => void
}

export function BugReportScreen({ onClose, onSuccess }: BugReportScreenProps) {
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
        <h1 className="text-xl font-semibold">不具合・改善要望</h1>
      </div>

      <div className="px-6 py-4">
        <form onSubmit={handleBugSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">詳細</label>
            <textarea
              name="bugMessage"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="不具合の内容や改善要望を詳しくご記入ください"
              required
            />
            <p className="text-xs text-gray-500 mt-2">※ 報告内容は開発チームに送信され、アプリの改善に活用されます</p>
          </div>

          <Button
            type="submit"
            disabled={bugSending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
          >
            {bugSending ? "送信中..." : "送信する"}
          </Button>
        </form>
      </div>

      <Navigation />
    </div>
  )
}

