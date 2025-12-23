"use client"

import { Star } from "lucide-react"
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
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="text-lg text-gray-800 hover:text-gray-900">
            ＜
          </button>
          <h2 className="text-lg font-semibold">店舗詳細</h2>
          <div className="w-8"></div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {restaurant.rating && <span>{restaurant.rating}</span>}
              {restaurant.genre && (
                <>
                  <span>•</span>
                  <span>{restaurant.genre}</span>
                </>
              )}
              {restaurant.distance && (
                <>
                  <span>•</span>
                  <span>{restaurant.distance}</span>
                </>
              )}
            </div>
            {restaurant.caption && (
              <div className="mt-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{restaurant.caption}</p>
              </div>
            )}
          </div>

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
