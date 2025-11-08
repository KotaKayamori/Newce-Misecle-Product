"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"
import { sendNotification } from "@/app/actions/notification-actions"

interface NotificationBroadcastScreenProps {
  onClose: () => void
}

export function NotificationBroadcastScreen({ onClose }: NotificationBroadcastScreenProps) {
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<any[]>([])

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      alert("タイトルと本文を入力してください")
      return
    }

    setIsSending(true)
    try {
      const result = await sendNotification({ title: notificationTitle, body: notificationBody })
      
      if (result.success) {
        setSentNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            title: notificationTitle,
            body: notificationBody,
            sentAt: new Date().toISOString(),
          },
        ])
        setNotificationTitle("")
        setNotificationBody("")
        alert("通知を送信しました")
      } else {
        alert("通知の送信に失敗しました")
      }
    } catch (error) {
      console.error("Notification error:", error)
      alert("エラーが発生しました")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">通知送信</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="通知タイトルを入力"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">本文</label>
            <textarea
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="通知本文を入力"
            />
          </div>
          <Button
            onClick={handleSendNotification}
            disabled={isSending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSending ? "送信中..." : "全ユーザーに通知を送信"}
          </Button>
        </div>

        {sentNotifications.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">送信済み通知</h3>
            {sentNotifications.map((notif) => (
              <div key={notif.id} className="p-3 border rounded">
                <div className="font-medium">{notif.title}</div>
                <div className="text-sm text-gray-600">{notif.body}</div>
                <div className="text-xs text-gray-400">{new Date(notif.sentAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}

