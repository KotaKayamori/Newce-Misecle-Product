"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"

interface ManagementScreenProps {
  onClose: () => void
}

const mockUnlinkedVideos = [
  {
    id: 1,
    videoId: "VID_001",
    thumbnail: "/placeholder.svg?height=120&width=120",
    caption: "美味しい焼き鳥が自慢の居酒屋「鳥心」渋谷店で撮影！ #焼き鳥 #居酒屋 #渋谷グルメ",
    extractedInfo: {
      storeName: "鳥心 渋谷店",
      address: "東京都渋谷区道玄坂2-10-12 新大宗ビル1号館B1F",
      phoneNumber: "03-5784-2345",
      businessHours: "17:00-24:00（L.O.23:30）",
      paymentMethods: "現金、クレジットカード、電子マネー",
      access: "JR渋谷駅ハチ公口より徒歩3分",
      tags: ["焼き鳥", "居酒屋", "渋谷グルメ"],
    },
    influencer: {
      name: "@tokyo_gourmet_lover",
      impression: "焼き鳥が本当に美味しくて、特に手羽先が絶品でした！雰囲気も良くてデートにもおすすめです.",
    },
    isLinked: false,
  },
  {
    id: 2,
    videoId: "VID_002",
    thumbnail: "/placeholder.svg?height=120&width=120",
    caption: "カフェ・ド・パリの絶品パンケーキ！ふわふわで最高 #カフェ #パンケーキ #表参道",
    extractedInfo: {
      storeName: "カフェ・ド・パリ",
      address: "東京都渋谷区神宮前4-12-10 表参道ヒルズ2F",
      phoneNumber: "03-3497-8901",
      businessHours: "8:00-22:00（L.O.21:30）",
      paymentMethods: "現金、クレジットカード、PayPay",
      access: "東京メトロ表参道駅A2出口より徒歩1分",
      tags: ["カフェ", "パンケーキ", "表参道"],
    },
    influencer: {
      name: "@cafe_hopping_girl",
      impression: "パンケーキがふわふわで感動しました！コーヒーも香り高くて、朝から贅沢な気分になれます.",
    },
    isLinked: false,
  },
  {
    id: 3,
    videoId: "VID_003",
    thumbnail: "/placeholder.svg?height=120&width=120",
    caption: "焼肉 炭火亭の極上和牛！口の中でとろける美味しさ #焼肉 #和牛 #新宿",
    extractedInfo: {
      storeName: "焼肉 炭火亭",
      address: "東京都新宿区歌舞伎町1-14-7 林ビル3F",
      phoneNumber: "03-3209-5678",
      businessHours: "17:00-翌2:00（L.O.翌1:30）",
      paymentMethods: "現金、クレジットカード、電子マネー、QRコード決済",
      access: "JR新宿駅東口より徒歩5分",
      tags: ["焼肉", "和牛", "新宿"],
    },
    influencer: {
      name: "@meat_master_tokyo",
      impression: "A5ランクの和牛が本当に美味しい！炭火で焼いた香ばしさと肉の旨味が最高でした.",
    },
    isLinked: false,
  },
]

export function ManagementScreen({ onClose }: ManagementScreenProps) {
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [emailAddress, setEmailAddress] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [showStoreDetails, setShowStoreDetails] = useState<number | null>(null)

  const handleLinkVideo = async (video: any) => {
    if (!emailAddress.trim()) {
      alert("メールアドレスを入力してください")
      return
    }

    setIsLinking(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert(
      `動画ID: ${video.videoId} と店舗「${video.extractedInfo.storeName}」がメールアドレス「${emailAddress}」に紐付けられました！`,
    )
    setSelectedVideo(null)
    setEmailAddress("")
    setIsLinking(false)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">管理画面</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">店舗管理者の方へ</h2>
            <p className="text-sm text-blue-700">
              Instagramから取り込まれた動画と店舗情報を紐付けることで、お客様からの予約を受け付けることができます。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">未設定の動画一覧</h3>
            <div className="space-y-4">
              {mockUnlinkedVideos.map((video) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex gap-6">
                    <div className="relative flex-shrink-0 w-32">
                      <div className="aspect-[9/16] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt="動画サムネイル"
                          className="w-full h-full rounded object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                          <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">動画ID: {video.videoId}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.caption}</p>

                      {/* Action Buttons */}
                      <div className="space-y-3 mb-4">
                        <Button onClick={() => setSelectedVideo(video)} variant="outline" className="w-full py-2">
                          メールアドレスを設定
                        </Button>
                        <Button
                          onClick={() => setShowStoreDetails(showStoreDetails === video.id ? null : video.id)}
                          variant="outline"
                          className="w-full py-2"
                        >
                          {showStoreDetails === video.id ? "店舗情報を隠す" : "店舗情報を見る"}
                        </Button>
                      </div>

                      {/* Store Details */}
                      {showStoreDetails === video.id && (
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-3 text-gray-800">店舗情報</h4>
                            <div className="space-y-3 text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">店舗名</p>
                                  <p className="text-gray-600">{video.extractedInfo.storeName}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">電話番号</p>
                                  <p className="text-gray-600">{video.extractedInfo.phoneNumber}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">住所</p>
                                <p className="text-gray-600">{video.extractedInfo.address}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">営業時間</p>
                                  <p className="text-gray-600">{video.extractedInfo.businessHours}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">決済方法</p>
                                  <p className="text-gray-600">{video.extractedInfo.paymentMethods}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">アクセス</p>
                                <p className="text-gray-600">{video.extractedInfo.access}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-3 text-blue-800">紹介インフルエンサー</h4>
                            <div className="space-y-2 text-sm">
                              <p className="font-medium text-blue-700">{video.influencer.name}</p>
                              <p className="text-gray-700 italic">&quot;{video.influencer.impression}&quot;</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Email Setting Form */}
                      {selectedVideo?.id === video.id && (
                        <div className="space-y-4 mt-4 p-4 bg-yellow-50 rounded-lg">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              店舗のメールアドレス
                            </label>
                            <input
                              type="email"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="store@example.com"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleLinkVideo(video)}
                              disabled={isLinking}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                            >
                              {isLinking ? "紐付け中..." : "紐付ける"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedVideo(null)
                                setEmailAddress("")
                              }}
                              className="px-6 py-2"
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mockUnlinkedVideos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">未設定の動画はありません</p>
                <p className="text-xs text-gray-400">すべての動画が店舗と紐付けられています</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

