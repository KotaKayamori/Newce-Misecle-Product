"use client"
import Navigation from "@/components/navigation"
import { Heart, Send, Bookmark, Star, Calendar, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface BookmarkedVideo {
  id: string
  created_at: string
  videos: {
    id: string
    title: string
    categories: string[]
    playback_url: string
    caption: string
    created_at: string
    owner_id: string
  }
}

export default function BookmarksPage() {
  const router = useRouter()
  const [bookmarkedVideos, setBookmarkedVideos] = useState<BookmarkedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  // ブックマークした動画を取得
  const fetchBookmarkedVideos = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('ログインが必要です')
        setLoading(false)
        return
      }

      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ブックマークの取得に失敗しました')
      }

      const data = await response.json()
      setBookmarkedVideos(data.bookmarks || [])
    } catch (err) {
      console.error('Failed to fetch bookmarked videos:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // ブックマークを削除する関数
  const removeBookmark = async (videoId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) return

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      })

      if (response.ok) {
        // 楽観的更新：UIから即座に削除
        setBookmarkedVideos(prev => 
          prev.filter(bookmark => bookmark.videos.id !== videoId)
        )
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      // 失敗した場合は再度データを取得
      fetchBookmarkedVideos()
    }
  }

  useEffect(() => {
    fetchBookmarkedVideos()
  }, [])

  // ローディング状態
  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-20 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>ブックマークを読み込み中...</p>
        </div>
        <Navigation />
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen bg-black pb-20 flex items-center justify-center">
        <div className="text-white text-center px-6">
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={fetchBookmarkedVideos}
            className="bg-orange-600 hover:bg-orange-700"
          >
            再試行
          </Button>
        </div>
        <Navigation />
      </div>
    )
  }

  // ブックマークが空の場合
  if (bookmarkedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black pb-20 flex items-center justify-center">
        <div className="text-white text-center px-6">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">ブックマークした動画がありません</h2>
          <p className="text-gray-400 mb-6">気になる動画をブックマークしてみましょう</p>
          <Button 
            onClick={() => router.push('/search')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            動画を探す
          </Button>
        </div>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">ブックマーク</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{bookmarkedVideos.length}件</span>
            <button
              onClick={fetchBookmarkedVideos}
              disabled={loading}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ブックマークした動画フィード - フルスクリーン縦スクロール */}
      <div className="h-screen overflow-y-auto snap-y snap-mandatory">
        {bookmarkedVideos.map((bookmark, index) => {
          const video = bookmark.videos
          
          return (
            <div key={bookmark.id} className="h-screen w-full relative snap-start">
              {/* 動画背景 */}
              <video 
                src={video.playback_url} 
                className="w-full h-full object-cover" 
                muted 
                loop 
                autoPlay 
                playsInline 
              />

              {/* オーバーレイコンテンツ */}
              <div className="absolute inset-0 flex">
                {/* 左側 - 動画情報 */}
                <div className="flex-1 flex flex-col justify-end p-4 pb-24">
                  <div className="text-white">
                    {/* 動画タイトル */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold mb-2">
                        {video.title || video.caption || '無題の動画'}
                      </h3>
                      <p className="text-sm text-gray-300">
                        ブックマーク日: {new Date(bookmark.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>

                    {/* 予約・詳細ボタン */}
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => {
                          const restaurantData = {
                            id: video.id,
                            restaurantName: video.title || '店舗名',
                            genre: video.categories[0] || '和食',
                            distance: "0.5km",
                            rating: 4.5,
                            restaurantEmail: 'info@restaurant.jp'
                          }
                          setSelectedRestaurant(restaurantData)
                          setShowReservationModal(true)
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        今すぐ予約する
                      </button>
                      <button
                        onClick={() => {
                          const restaurantData = {
                            id: video.id,
                            restaurantName: video.title || '店舗名',
                            genre: video.categories[0] || '和食',
                            distance: "0.5km",
                            rating: 4.5,
                            restaurantEmail: 'info@restaurant.jp'
                          }
                          setSelectedRestaurant(restaurantData)
                          setShowStoreDetailModal(true)
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center"
                      >
                        もっと見る…
                      </button>
                    </div>
                  </div>
                </div>

                {/* 右側 - アクションボタン */}
                <div className="w-16 flex flex-col items-center justify-end pb-20 gap-6">
                  {/* いいねボタン */}
                  <div className="flex flex-col items-center">
                    <button className="w-12 h-12 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                    </button>
                  </div>

                  {/* ブックマーク削除ボタン */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => removeBookmark(video.id)}
                      className="w-12 h-12 flex items-center justify-center"
                    >
                      <Bookmark className="w-8 h-8 text-white drop-shadow-lg fill-white" />
                    </button>
                  </div>

                  {/* シェアボタン */}
                  <div className="flex flex-col items-center">
                    <button className="w-12 h-12 flex items-center justify-center">
                      <Send className="w-8 h-8 text-white drop-shadow-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 新しい予約モーダル */}
      {showReservationModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowReservationModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">お店を予約する</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 名前入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">お名前</label>
                <input
                  type="text"
                  value={reservationData.name || ""}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="お名前を入力してください"
                />
              </div>

              {/* 人数選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">人数</label>
                <div className="flex items-center justify-center">
                  <select
                    value={reservationData.people}
                    onChange={(e) =>
                      setReservationData((prev) => ({ ...prev, people: Number.parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}名
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 日付選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">日付</label>
                <input
                  type="date"
                  value={reservationData.date}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* 時間帯選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">時間帯</label>
                <select
                  value={reservationData.time}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 11
                    const minute = i % 2 === 0 ? "00" : "30"
                    if (hour > 23) return null
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minute}`
                    return (
                      <option key={timeStr} value={timeStr}>
                        {timeStr}
                      </option>
                    )
                  }).filter(Boolean)}
                </select>
              </div>

              {/* 席タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">席タイプ</label>
                <select
                  value={reservationData.seatType}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, seatType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="指定なし">指定なし</option>
                  <option value="テーブル">テーブル</option>
                  <option value="カウンター">カウンター</option>
                  <option value="個室">個室</option>
                </select>
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">メッセージ（任意）</label>
                <textarea
                  value={reservationData.message}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="アレルギーや特別なリクエストがあればお書きください"
                />
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  // 予約リクエスト送信処理（現在はUI表示のみ）
                  alert("予約リクエストを送信しました！")
                  setShowReservationModal(false)
                }}
              >
                予約リクエストを送信
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 店舗詳細モーダル */}
      {showStoreDetailModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowStoreDetailModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">店舗詳細</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 店舗名 */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedRestaurant.restaurantName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRestaurant.rating}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.genre}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.distance}</span>
                </div>
              </div>

              {/* 店舗情報 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">店舗情報</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📍</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">住所</p>
                      <p className="text-sm text-gray-600">東京都渋谷区渋谷1-2-3 渋谷ビル2F</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📞</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">電話番号</p>
                      <p className="text-sm text-gray-600">03-1234-5678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🕒</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">営業時間</p>
                      <p className="text-sm text-gray-600">月〜土: 11:30-14:00, 17:00-23:00</p>
                      <p className="text-sm text-gray-600">日: 11:30-14:00, 17:00-22:00</p>
                      <p className="text-sm text-red-600">定休日: 火曜日</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">💳</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">決済方法</p>
                      <p className="text-sm text-gray-600">現金、QRコード、電子マネー</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🗺️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">アクセス</p>
                      <button
                        onClick={() => window.open("https://maps.google.com", "_blank")}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Googleマップで見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  setShowStoreDetailModal(false)
                  setShowReservationModal(true)
                }}
              >
                この店舗を予約する
              </Button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}