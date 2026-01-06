"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Bookmark, User } from "lucide-react"

type BottomMetaVariant = "account" | "date" | "none"

export interface AlbumCardProps {
  coverUrl?: string | null
  title?: string | null
  description?: string | null

  // Card interactions
  onClickCard?: () => void

  // Top-right bookmark circle button
  showTopBookmark?: boolean
  isBookmarked?: boolean
  onToggleBookmark?: (e: React.MouseEvent) => void

  // Bottom meta row (white background area under the cover)
  bottomMetaVariant?: BottomMetaVariant
  accountAvatarUrl?: string | null
  accountLabel?: string | null
  accountUserId?: string | null
  dateLabel?: string | null
}

export default function AlbumCard(props: AlbumCardProps) {
  const router = useRouter()
  const {
    coverUrl,
    title,
    description,
    onClickCard,
    showTopBookmark = true,
    isBookmarked = false,
    onToggleBookmark,
    bottomMetaVariant = "none",
    accountAvatarUrl,
    accountLabel,
    accountUserId,
    dateLabel,
  } = props

  const handleAccountClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (accountUserId) {
      router.push(`/profile/${accountUserId}`)
    }
  }

  return (
    <Card className="border-none shadow-none transition-shadow">
      <CardContent className="cursor-pointer p-0 rounded-lg overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-[4/5] relative" onClick={onClickCard} role="button" aria-label={title ?? "アルバムを開く"}>
          {/* Cover image */}
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={title ?? "album"} className="w-full h-full object-cover rounded-t-lg" />
          ) : (
            <div className="w-full h-full rounded-t-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              No Cover
            </div>
          )}

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
        </div>

        {/* Bottom white meta (optional) */}
        {bottomMetaVariant !== "none" && (
          <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
            {title && <h3 className="font-semibold text-sm mb-2 line-clamp-2">{title}</h3>}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bottomMetaVariant === "account" ? (
                  <button
                    onClick={handleAccountClick}
                    className={`flex items-center gap-2 ${accountUserId ? "hover:opacity-70 transition-opacity" : ""}`}
                    disabled={!accountUserId}
                  >
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {accountAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={accountAvatarUrl} alt={accountLabel ?? "user"} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{accountLabel ?? "@user"}</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-600">{dateLabel}</span>
                )}
              </div>

              {/* Small bookmark mirroring Searchの動画カードと合わせたい場合に表示を検討 */}
              {/* ここではアルバムは右上のブックマークのみに統一 */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

