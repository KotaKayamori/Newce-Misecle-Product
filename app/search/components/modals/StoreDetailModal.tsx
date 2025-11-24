"use client"

import { Button } from "@/components/ui/button"
import type { RestaurantInfo } from "../../types"

const sanitizeTelLink = (tel?: string | null) => tel?.replace(/[^\d+]/g, "") ?? ""

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

  const ownerLabel = restaurant.ownerLabel || null
  const primaryLabel = ownerLabel || restaurant.restaurantName || "店舗情報"
  const secondaryLabel = ownerLabel
    ? restaurant.restaurantName
    : [restaurant.genre, restaurant.distance].filter((text) => text && text.trim().length > 0).join(" / ")
  const avatarFallback = primaryLabel.replace(/^@/, "").charAt(0).toUpperCase() || "U"
  const storeEntries = (() => {
    const entries = (restaurant.stores ?? []).map((store, index) => {
      const sanitizedTel = sanitizeTelLink(store.tel)
      return {
        key: `${store.name}-${index}`,
        order: index + 1,
        name: store.name,
        telLabel: store.tel ?? "",
        sanitizedTel,
        hasTel: sanitizedTel.length > 0,
      }
    })

    if (!entries.length && restaurant.tel) {
      const sanitizedTel = sanitizeTelLink(restaurant.tel)
      entries.push({
        key: "primary-tel",
        order: 1,
        name: restaurant.restaurantName || "店舗情報",
        telLabel: restaurant.tel,
        sanitizedTel,
        hasTel: sanitizedTel.length > 0,
      })
    }

    return entries
  })()

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ＜
          </Button>
          <h2 className="text-lg font-semibold">店舗詳細</h2>
          <div className="w-8"></div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold overflow-hidden">
              {restaurant.ownerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={restaurant.ownerAvatarUrl} alt={ownerLabel ?? "user"} className="w-full h-full object-cover" />
              ) : (
                avatarFallback
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{primaryLabel}</p>
              {secondaryLabel && <p className="text-xs text-gray-600">{secondaryLabel}</p>}
            </div>
          </div>

          <div className="space-y-4">
            {restaurant.caption ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{restaurant.caption}</div>
            ) : (
              <div className="flex items-center justify-center rounded-lg bg-gray-50 py-6 text-sm text-gray-500">
                {EMPTY_INFLUENCER_COMMENT_MESSAGE}
              </div>
            )}
          </div>

          {!!storeEntries.length && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">紹介店舗一覧</h3>
              <div className="space-y-3">
                {storeEntries.map((store) => (
                  <div key={store.key} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      店舗{store.order}
                      <span className="ml-2 text-gray-700">{store.name}</span>
                    </p>
                    {store.hasTel ? (
                      <Button asChild variant="outline" className="mt-2 w-full text-sm font-semibold text-orange-700">
                        <a href={`tel:${store.sanitizedTel}`}>{store.telLabel}</a>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="mt-2 w-full text-sm text-gray-500">
                        電話番号が見つかりません
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
              onClick={onReserve}
            >
              この店舗を予約する
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
