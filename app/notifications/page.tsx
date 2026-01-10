import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Gift, AlertCircle } from "lucide-react"
import Navigation from "@/components/navigation"

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "reservation",
      title: "予約確認のお知らせ",
      message: "寿司 銀座での予約が確定しました。1月20日 18:30〜",
      time: "2時間前",
      read: false,
      icon: Calendar,
    },
    {
      id: 2,
      type: "promotion",
      title: "会員限定特典",
      message: "今週末限定！対象店舗で20%オフクーポンをプレゼント",
      time: "1日前",
      read: false,
      icon: Gift,
    },
    {
      id: 3,
      type: "alert",
      title: "仮押さえ期限のお知らせ",
      message: "カフェ・ド・パリの仮押さえがあと15分で期限切れになります",
      time: "2日前",
      read: true,
      icon: AlertCircle,
    },
    {
      id: 4,
      type: "system",
      title: "アプリアップデート",
      message: "新機能が追加されました。キャンセル待ち通知機能をお試しください",
      time: "3日前",
      read: true,
      icon: Bell,
    },
  ]

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reservation":
        return "bg-blue-100 text-blue-800"
      case "promotion":
        return "bg-green-100 text-green-800"
      case "alert":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case "reservation":
        return "予約"
      case "promotion":
        return "特典"
      case "alert":
        return "重要"
      default:
        return "お知らせ"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold">お知らせ・プッシュ通知</h1>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-3">
          {notifications.map((notification) => {
            const IconComponent = notification.icon
            return (
              <Card key={notification.id} className={`${!notification.read ? "border-blue-200 bg-blue-50/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <Badge variant="secondary" className={`text-xs ${getNotificationColor(notification.type)}`}>
                        {getNotificationLabel(notification.type)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
