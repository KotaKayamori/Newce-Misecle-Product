"use client"

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react"

type MediaActionVariant = "overlay" | "card"

export interface MediaActionsProps {
  liked: boolean
  bookmarked: boolean
  likeCount?: number
  commentCount?: number
  onToggleLike: () => void
  onToggleBookmark: () => void
  onShare?: () => void | Promise<void>
  onComment?: () => void
  disabledLike?: boolean
  disabledBookmark?: boolean
  disabledShare?: boolean
  disabledComment?: boolean
  variant?: MediaActionVariant
  className?: string
}

function formatCount(count?: number) {
  if (count == null) return ""
  if (count < 1000) return `${count}`
  const rounded = Math.round((count / 1000) * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k`
}

function buttonBase(variant: MediaActionVariant) {
  if (variant === "card") {
    return "w-10 h-10 rounded-full bg-black/55 hover:bg-black/65"
  }
  return "w-12 h-12"
}

function iconDropShadow() {
  return { filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6)) drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }
}

export default function MediaActions({
  liked,
  bookmarked,
  likeCount = 0,
  commentCount,
  onToggleLike,
  onToggleBookmark,
  onShare,
  onComment,
  disabledLike,
  disabledBookmark,
  disabledShare,
  disabledComment,
  variant = "overlay",
  className = "",
}: MediaActionsProps) {
  const container = `flex flex-col items-center gap-6 ${className}`.trim()
  const buttonClass = buttonBase(variant)

  return (
    <div className={container}>
      <div className="flex flex-col items-center">
        <button
          type="button"
          className={`flex items-center justify-center ${buttonClass}`}
          onClick={onToggleLike}
          aria-label={liked ? "いいね解除" : "いいね"}
          disabled={disabledLike}
        >
          <Heart
            className={`w-8 h-8 ${liked ? "fill-red-500 text-transparent" : "text-white"}`}
            style={iconDropShadow()}
          />
        </button>
        <span className="text-white text-xs font-medium mt-1" style={iconDropShadow()}>
          {formatCount(likeCount)}
        </span>
      </div>

      {onComment && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`flex items-center justify-center ${buttonClass}`}
            onClick={onComment}
            aria-label="コメント"
            disabled={disabledComment}
          >
            <MessageCircle className="w-8 h-8 text-white" style={iconDropShadow()} />
          </button>
          {commentCount != null && (
            <span className="text-white text-xs font-medium mt-1" style={iconDropShadow()}>
              {formatCount(commentCount)}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col items-center">
        <button
          type="button"
          className={`flex items-center justify-center ${buttonClass}`}
          onClick={onToggleBookmark}
          aria-label={bookmarked ? "ブックマーク解除" : "ブックマーク"}
          disabled={disabledBookmark}
        >
          <Bookmark
            className={`w-8 h-8 ${bookmarked ? "fill-orange-500 text-orange-500" : "text-white"}`}
            style={iconDropShadow()}
          />
        </button>
      </div>

      {onShare && (
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`flex items-center justify-center ${buttonClass}`}
            onClick={onShare}
            aria-label="共有"
            disabled={disabledShare}
          >
            <Send className="w-8 h-8 text-white" style={iconDropShadow()} />
          </button>
        </div>
      )}
    </div>
  )
}
