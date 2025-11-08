"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, ThumbsUp, Calendar, Gift, AlertCircle, Bell } from "lucide-react"
import Navigation from "@/components/navigation"

export default function MessagesPage() {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reservation":
        return "bg-gray-100 text-gray-800"
      case "promotion":
        return "bg-emerald-100 text-emerald-800"
      case "alert":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return Calendar
      case "promotion":
        return Gift
      case "alert":
        return AlertCircle
      default:
        return Bell
    }
  }

  // const getReactionIcon = (type: string) => {
  //   switch (type) {
  //     case "heart":
  //       return <Heart className="w-4 h-4 fill-red-500 text-red-500" />
  //     case "thumbsup":
  //       return <ThumbsUp className="w-4 h-4 fill-blue-500 text-blue-500" />
  //     default:
  //       return null
  //   }
  // } // TODO: 未使用

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 text-center">
        <h1 className="text-xl font-semibold">メッセージ</h1>
      </div>
      <div className="px-6">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="grid grid-cols-3 bg-transparent h-auto p-0 border-0 w-full">
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                プッシュ通知
              </TabsTrigger>
              <TabsTrigger
                value="coupons"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                クーポン
              </TabsTrigger>
              <TabsTrigger
                value="announcements"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                お知らせ
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-4">
            <div className="px-6 py-12 text-center text-gray-600">
              通知機能は現在準備中です。
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="mt-4">
            <div className="px-6 py-4">
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "焼き鳥5本セット500円引き",
                    description: "人気の焼き鳥5本セットが500円引きでお楽しみいただけます",
                    discount: "¥500OFF",
                    validUntil: "2024年2月15日",
                    restaurantName: "炭火焼き鳥 とり源",
                    used: false,
                  },
                  {
                    id: 2,
                    title: "ドリンク1杯無料",
                    description: "焼き鳥注文でドリンク1杯サービス",
                    discount: "1杯無料",
                    validUntil: "2024年2月29日",
                    restaurantName: "居酒屋 大漁",
                    used: false,
                  },
                  {
                    id: 3,
                    title: "ランチセット20%OFF",
                    description: "平日限定のランチセットが20%オフ",
                    discount: "20%OFF",
                    validUntil: "2024年2月10日",
                    restaurantName: "カフェ・ド・パリ",
                    used: true,
                  },
                ].map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`border rounded-lg p-4 ${coupon.used ? "bg-gray-50 opacity-60" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{coupon.title}</h3>
                        <p className="text-xs text-gray-600 mb-1">{coupon.restaurantName}</p>
                        <p className="text-xs text-gray-500">{coupon.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${coupon.used ? "text-gray-400" : "text-orange-600"}`}>
                          {coupon.discount}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">有効期限: {coupon.validUntil}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${coupon.used ? "bg-gray-200 text-gray-600" : "bg-orange-100 text-orange-800"}`}
                      >
                        {coupon.used ? "使用済み" : "未使用"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="mt-4">
            <div className="px-6 py-4">
              <div className="space-y-0">
                {[
                  {
                    id: 1,
                    title: "新機能のお知らせ",
                    message: "キャンセル待ち通知機能が追加されました。人気店舗の空席情報をいち早くお知らせします。",
                    date: "2024年1月15日",
                    read: false,
                  },
                  {
                    id: 2,
                    title: "メンテナンスのお知らせ",
                    message:
                      "1月20日 2:00-4:00にシステムメンテナンスを実施いたします。ご利用いただけない時間がございます。",
                    date: "2024年1���12日",
                    read: true,
                  },
                  {
                    id: 3,
                    title: "プレミアム会員特典追加",
                    message: "プレミアム会員様限定で、新たに5つの提携店舗が追加されました。ぜひご利用ください。",
                    date: "2024年1月8日",
                    read: true,
                  },
                ].map((announcement, index) => (
                  <div key={announcement.id}>
                    <div className={`p-4 ${!announcement.read ? "bg-blue-50/30" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{announcement.title}</h3>
                        <div className="flex items-center gap-2">
                          {!announcement.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          <span className="text-xs text-gray-500">{announcement.date}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{announcement.message}</p>
                    </div>
                    {index < 2 && <div className="border-b border-gray-200 mx-4"></div>}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  )
}
