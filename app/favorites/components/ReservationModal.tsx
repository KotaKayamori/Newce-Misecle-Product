"use client"

import type { ReservationFormData, SelectedRestaurant } from "@/app/favorites/types"

interface ReservationModalProps {
  open: boolean
  restaurant: SelectedRestaurant | null
  data: ReservationFormData
  onChange: (values: Partial<ReservationFormData>) => void
  onClose: () => void
  onSubmit: () => void
}

export function ReservationModal({ open, restaurant, data, onChange, onClose, onSubmit }: ReservationModalProps) {
  if (!open || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="text-lg">
            ＜
          </button>
          <h2 className="text-lg font-semibold">お店を予約する</h2>
          <div className="w-8"></div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">お名前</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="お名前を入力してください"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">人数</label>
            <select
              value={data.people}
              onChange={(e) => onChange({ people: Number.parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}名
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">日付</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">時間帯</label>
            <select
              value={data.time}
              onChange={(e) => onChange({ time: e.target.value })}
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
              }).filter(Boolean) as any}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">席タイプ</label>
            <select
              value={data.seatType}
              onChange={(e) => onChange({ seatType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="指定なし">指定なし</option>
              <option value="テーブル">テーブル</option>
              <option value="カウンター">カウンター</option>
              <option value="個室">個室</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">メッセージ（任意）</label>
            <textarea
              value={data.message}
              onChange={(e) => onChange({ message: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="アレルギーや特別なリクエストがあればお書きください"
            />
          </div>

          <button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg"
            onClick={onSubmit}
          >
            予約リクエストを送信
          </button>
        </div>
      </div>
    </div>
  )
}
