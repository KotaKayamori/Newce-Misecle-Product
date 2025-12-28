"use client"

import { Button } from "@/components/ui/button"
import type { VideoData } from "@/hooks/useRandomVideos"

interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    avatar?: string | null
    isFollowing?: boolean
  } | null
  videos: VideoData[]
  onToggleFollow: (id: string) => Promise<void>
}

export function UserProfileModal({
  open,
  onClose,
  user,
  videos,
  onToggleFollow,
}: UserProfileModalProps) {
  if (!open || !user) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300 h-[90vh] flex flex-col">
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b relative">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ＜
            </Button>
            <h2 className="text-lg font-semibold absolute left-1/2 transform -translate-x-1/2">プロフィール</h2>
            <div className="w-8"></div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-2xl shadow-lg">
                {user.name.charAt(1).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">{user.name}</h3>
                <p className="text-gray-600 text-sm mb-1">グルメインフルエンサー</p>
                <p className="text-gray-500 text-xs">📍 東京 • 🍽️ 美味しいお店を紹介中</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                🍜 東京のグルメスポットを毎日投稿
                <br />📸 美味しい瞬間をお届け
                <br />💌 コラボのご相談はDMまで
                <br />
                ⬇️ 最新のおすすめ店舗をチェック！
              </p>
            </div>

            {/* Stats */}
            <div className="flex justify-around mb-6 py-4 border-y">
              <div className="text-center">
                <div className="font-bold text-lg">127</div>
                <div className="text-gray-600 text-sm">投稿</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">12.4K</div>
                <div className="text-gray-600 text-sm">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">892</div>
                <div className="text-gray-600 text-sm">フォロー中</div>
              </div>
            </div>

            {/* Follow Button */}
            <Button
              className={`w-full py-3 font-semibold transition mb-4 ${
                user.isFollowing
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={async () => {
                if (user.isFollowing) {
                  await onToggleFollow(user.id)
                } else {
                  window.open(`https://instagram.com/${user.name}`, "_blank")
                }
              }}
            >
              {user.isFollowing ? "フォロー中" : "フォローする"}
            </Button>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <Button
                variant="outline"
                className="w-full py-2 text-sm font-medium border-gray-300 hover:bg-gray-50 bg-transparent"
                onClick={() =>
                  window.open(
                    `https://instagram.com/direct/new/?username=${user.name.replace("@", "")}`,
                    "_blank",
                  )
                }
              >
                メッセージ
              </Button>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pb-6">
            <h4 className="font-semibold mb-4">投稿</h4>
            <div className="grid grid-cols-3 gap-1">
              {videos.slice(0, 9).map((post, index) => (
                <div key={index} className="aspect-square relative">
                  <video
                    src={post.public_url}
                    className="w-full h-full object-cover rounded"
                    muted
                    loop
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


