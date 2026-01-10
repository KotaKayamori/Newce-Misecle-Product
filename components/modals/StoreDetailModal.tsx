"use client"

import type { SelectedRestaurant } from "@/app/favorites/types"

interface StoreDetailModalProps {
  open: boolean
  restaurant: SelectedRestaurant | null
  onClose: () => void
  onReserve: () => void
}

export function StoreDetailModal({ open, restaurant, onClose, onReserve }: StoreDetailModalProps) {
  if (!open || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={onClose} className="text-lg text-gray-800 hover:text-gray-900">
            ＜
          </button>
          <h2 className="text-lg font-semibold">店舗詳細</h2>
          <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-600 font-semibold">
              {restaurant.ownerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.ownerAvatarUrl} alt={restaurant.ownerLabel ?? "user"} className="w-full h-full object-cover" />
              ) : (
                (restaurant.ownerLabel ?? "U").replace(/^@/, "").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-base">
                {restaurant.ownerLabel ?? "投稿者"}
              </span>
            </div>
          </div>

          {restaurant.caption && (
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{restaurant.caption}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white pb-[calc(env(safe-area-inset-bottom)+var(--vvb)+24px)]">
          <button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg"
            onClick={() => {
              onClose()
              onReserve()
            }}
          >
            この店舗を予約する
          </button>
        </div>
      </div>
    </div>
  )
}
