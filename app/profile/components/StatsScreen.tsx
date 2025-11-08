"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"

interface StatsScreenProps {
  onClose: () => void
  initialTab?: "followers" | "following" | "posts"
}

const mockFollowers = [
  { id: 1, name: "田中花子", username: "@hanako_tanaka", avatar: "/placeholder.svg?height=40&width=40", isFollowing: true },
  { id: 2, name: "佐藤太郎", username: "@taro_sato", avatar: "/placeholder.svg?height=40&width=40", isFollowing: false },
  { id: 3, name: "山田美咲", username: "@misaki_yamada", avatar: "/placeholder.svg?height=40&width=40", isFollowing: true },
  { id: 4, name: "鈴木健太", username: "@kenta_suzuki", avatar: "/placeholder.svg?height=40&width=40", isFollowing: false },
]

const mockFollowing = [
  { id: 1, type: "user", name: "グルメ太郎", username: "@gourmet_taro", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 2, type: "restaurant", name: "カフェ・ド・パリ", username: "@cafe_de_paris", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 3, type: "user", name: "料理好き花子", username: "@cooking_hanako", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 4, type: "restaurant", name: "焼肉 炭火亭", username: "@yakiniku_sumibiya", avatar: "/placeholder.svg?height=40&width=40" },
]

const mockPosts = [
  { id: 1, thumbnail: "/placeholder.svg?height=120&width=120", title: "美味しい焼き鳥", views: "1.2k", likes: "89", date: "2024年1月15日" },
  { id: 2, thumbnail: "/placeholder.svg?height=120&width=120", title: "カフェのパンケーキ", views: "856", likes: "67", date: "2024年1月12日" },
  { id: 3, thumbnail: "/placeholder.svg?height=120&width=120", title: "ラーメンの作り方", views: "2.1k", likes: "134", date: "2024年1月10日" },
  { id: 4, thumbnail: "/placeholder.svg?height=120&width=120", title: "寿司職人の技", views: "3.4k", likes: "256", date: "2024年1月8日" },
  { id: 5, thumbnail: "/placeholder.svg?height=120&width=120", title: "イタリアンパスタ", views: "945", likes: "78", date: "2024年1月5日" },
  { id: 6, thumbnail: "/placeholder.svg?height=120&width=120", title: "デザート作り", views: "1.8k", likes: "123", date: "2024年1月3日" },
]

export function StatsScreen({ onClose, initialTab = "followers" }: StatsScreenProps) {
  const [selectedStatsTab, setSelectedStatsTab] = useState<"followers" | "following" | "posts">(initialTab)
  const postsCount = mockPosts.length

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">Misecle-Users</h1>
      </div>

      {/* Stats Tabs */}
      <div className="px-6">
        <div className="flex">
          <button
            onClick={() => setSelectedStatsTab("followers")}
            className={`flex-1 text-center py-3 relative ${
              selectedStatsTab === "followers" ? "text-black" : "text-gray-600"
            }`}
          >
            <span className="font-medium">フォロワー</span>
            <span className="ml-2 text-sm">128</span>
            {selectedStatsTab === "followers" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
            )}
          </button>
          <button
            onClick={() => setSelectedStatsTab("following")}
            className={`flex-1 text-center py-3 relative ${
              selectedStatsTab === "following" ? "text-black" : "text-gray-600"
            }`}
          >
            <span className="font-medium">フォロー中</span>
            <span className="ml-2 text-sm">56</span>
            {selectedStatsTab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
            )}
          </button>
          <button
            onClick={() => setSelectedStatsTab("posts")}
            className={`flex-1 text-center py-3 relative ${
              selectedStatsTab === "posts" ? "text-black" : "text-gray-600"
            }`}
          >
            <span className="font-medium">投稿数</span>
            <span className="ml-2 text-sm">{postsCount}</span>
            {selectedStatsTab === "posts" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {selectedStatsTab === "followers" && (
          <div className="space-y-4">
            {mockFollowers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                    {follower.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{follower.name}</h4>
                    <p className="text-xs text-gray-500">{follower.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={follower.isFollowing ? "outline" : "default"}
                  className={follower.isFollowing ? "bg-transparent" : "bg-orange-600 hover:bg-orange-700 text-white"}
                >
                  {follower.isFollowing ? "フォロー中" : "フォローする"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {selectedStatsTab === "following" && (
          <div className="space-y-4">
            {mockFollowing.map((following) => (
              <div key={following.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                    {following.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{following.name}</h4>
                    <p className="text-xs text-gray-500">{following.username}</p>
                    <p className="text-xs text-orange-600">{following.type === "restaurant" ? "店舗" : "ユーザー"}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="bg-transparent">
                  フォロー中
                </Button>
              </div>
            ))}
          </div>
        )}

        {selectedStatsTab === "posts" && (
          <div className="grid grid-cols-3 gap-2">
            {mockPosts.map((post) => (
              <div
                key={post.id}
                className="relative aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <video src="/placeholder-video.mp4" className="w-full h-full object-cover" muted loop playsInline />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium line-clamp-2 mb-1">{post.title}</p>
                  <div className="flex items-center justify-between text-white text-xs">
                    <span>{post.views} 回再生</span>
                    <span>♡ {post.likes}</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}

