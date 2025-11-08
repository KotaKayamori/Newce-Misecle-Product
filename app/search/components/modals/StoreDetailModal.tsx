"use client"

import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import type { RestaurantInfo } from "../../types"

interface StoreDetailModalProps {
  open: boolean
  onClose: () => void
  restaurant: RestaurantInfo | null
  onReserve: () => void
}

const EMPTY_INFLUENCER_COMMENT_MESSAGE = "感想は追加されていません"

export function StoreDetailModal({
  open,
  onClose,
  restaurant,
  onReserve,
}: StoreDetailModalProps) {
  if (!open || !restaurant) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ＜
          </Button>
          <h2 className="text-lg font-semibold">店舗詳細</h2>
          <div className="w-8"></div>
        </div>

        <div className="p-6 space-y-6">
          {/* 店舗名 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{restaurant.rating}</span>
              <span>•</span>
              <span>{restaurant.genre}</span>
              <span>•</span>
              <span>{restaurant.distance}</span>
            </div>
          </div>

          {/* 店舗情報 */}
          {/* 店舗情報セクションは今後の拡張用に保持 */}
          {/*
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">店舗情報</h4>
            <div className="flex items-center justify-center rounded-lg bg-gray-50 py-6 text-sm text-gray-500">
              {EMPTY_STORE_INFO_MESSAGE}
            </div>
          </div>
          */}

          {/* インフルエンサーの感想 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">詳細情報</h4>
            {restaurant?.caption ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {restaurant.caption}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 py-6 text-sm text-gray-500">
                {EMPTY_INFLUENCER_COMMENT_MESSAGE}
              </div>
            )}
          </div>

          {/* 予約ボタン */}
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
            onClick={onReserve}
          >
            この店舗を予約する
          </Button>
        </div>
      </div>
    </div>
  )
}


