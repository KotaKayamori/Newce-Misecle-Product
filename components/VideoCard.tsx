"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bookmark, User } from "lucide-react"
import React from "react"

type BottomMetaVariant = "account" | "date" | "none"

interface VideoCardProps {
  posterUrl: string
  title?: string | null
  onClickCard?: () => void

  // Top-right bookmark circle button
  showTopBookmark?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: (e: React.MouseEvent) => void

  // Bottom white meta block
  bottomMetaVariant?: BottomMetaVariant
  accountAvatarUrl?: string | null
  accountLabel?: string | null
  dateLabel?: string | null
  showSmallBookmark?: boolean
}

export default function VideoCard(props: VideoCardProps) {
  const {
    posterUrl,
    title,
    onClickCard,
    showTopBookmark = false,
    isBookmarked = false,
    onToggleBookmark,
    bottomMetaVariant = "account",
    accountAvatarUrl,
    accountLabel,
    dateLabel,
    showSmallBookmark = false,
  } = props

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-[9/16] relative">
          {/* Use poster as thumbnail; do not autoplay */}
          <video
            src={undefined as any}
            poster={posterUrl}
            className="w-full h-full object-cover rounded-t-lg cursor-pointer"
            playsInline
            preload="metadata"
            controls={false}
            onClick={(e) => {
              e.stopPropagation()
              onClickCard?.()
            }}
          />

          {showTopBookmark && (
            <div className="absolute top-2 right-2 z-10">
              <button
                type="button"
                onClick={(e) => onToggleBookmark?.(e)}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition"
                aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-orange-500 text-orange-500" : "text-white"}`} />
              </button>
            </div>
          )}

          {/* Play overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer rounded-t-lg"
            onClick={(e) => {
              e.stopPropagation()
              onClickCard?.()
            }}
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all">
              <div className="w-0 h-0 border-l-[20px] border-l-gray-800 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>

        {bottomMetaVariant !== "none" && (
          <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">{title || ""}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bottomMetaVariant === "account" ? (
                  <>
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {accountAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={accountAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{accountLabel || "@user"}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-600">{dateLabel}</span>
                )}
              </div>

              {showSmallBookmark && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookmark?.(e)
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-orange-500 text-orange-500" : "text-gray-500"}`} />
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


