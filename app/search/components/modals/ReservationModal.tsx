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
  reservationData: _reservationData,
  onReservationDataChange: _onReservationDataChange,
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
          {/*
            既存の入力フォームを一時的に無効化しています。
            元に戻す際はこのコメントブロックを削除してください。
          */}
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


