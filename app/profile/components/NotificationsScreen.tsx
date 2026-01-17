"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"

interface NotificationsScreenProps {
  onClose: () => void
  notifications: any[]
}

export function NotificationsScreen({ onClose, notifications }: NotificationsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">通知一覧</h1>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <span className="text-xs text-gray-500">{notification.date}</span>
              </div>
              <p className="text-sm text-gray-600">{notification.message}</p>
              {!notification.read && <div className="mt-2 text-xs text-blue-600">未読</div>}
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">通知はありません</p>
              <p className="text-xs text-gray-400">新しい通知があればここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

