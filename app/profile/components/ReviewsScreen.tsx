"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { Star } from "lucide-react"

interface ReviewsScreenProps {
  onClose: () => void
  visitHistory: any[]
}

export function ReviewsScreen({ onClose, visitHistory }: ReviewsScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">レビューとコメント</h1>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-4">
          {visitHistory.map((visit) => (
            <div key={visit.id} className="flex gap-3 pb-4 border-b last:border-b-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visit.image || "/placeholder.svg"}
                alt={visit.restaurantName}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-sm">{visit.restaurantName}</h4>
                  <span className="text-xs text-gray-500">{visit.date}</span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(visit.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-600 ml-1">{visit.rating}</span>
                </div>

                <p className="text-xs text-gray-600 mb-2">{visit.review}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">レビュー投稿済み</span>
                  <button className="text-xs text-gray-500 hover:text-gray-700">編集</button>
                </div>
              </div>
            </div>
          ))}

          {visitHistory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">まだレビューを投稿していません</p>
              <p className="text-xs text-gray-400">来店した店舗にレビューを投稿してみましょう</p>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  )
}

