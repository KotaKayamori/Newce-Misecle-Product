"use client"

import { Button } from "@/components/ui/button"
import type { RestaurantInfo } from "../../types"

interface ReservationModalProps {
  open: boolean
  onClose: () => void
  restaurant: RestaurantInfo | null
  reservationData: {
    name: string
    people: number
    date: string
    time: string
    seatType: string
    message: string
  }
  onReservationDataChange: (data: Partial<ReservationModalProps["reservationData"]>) => void
  onSubmit: () => void
}

export function ReservationModal({
  open,
  onClose,
  restaurant,
  reservationData,
  onReservationDataChange,
  onSubmit,
}: ReservationModalProps) {
  if (!open || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
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
              onChange={(e) => onReservationDataChange({ name: e.target.value })}
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
                onChange={(e) => onReservationDataChange({ people: Number.parseInt(e.target.value) })}
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
              onChange={(e) => onReservationDataChange({ date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* 時間帯選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">時間帯</label>
            <select
              value={reservationData.time}
              onChange={(e) => onReservationDataChange({ time: e.target.value })}
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
              onChange={(e) => onReservationDataChange({ seatType: e.target.value })}
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
              onChange={(e) => onReservationDataChange({ message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="アレルギーや特別なリクエストがあればお書きください"
            />
          </div>

          {/* 予約ボタン */}
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
            onClick={onSubmit}
          >
            予約リクエストを送信
          </Button>
        </div>
      </div>
    </div>
  )
}


