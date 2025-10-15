"use client"

// Reels feed is temporarily disabled. The original implementation is preserved below in a block comment.

export default function ReelsFeedLive() {
  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden flex items-center justify-center">
      <p className="text-sm text-gray-300">動画フィードは現在停止中です。</p>
    </div>
  )
}

/*
ORIGINAL (disabled):

// import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// import { useRouter } from "next/navigation"
// import { supabase } from "@/lib/supabase"
// import { toggleLike } from "@/lib/likes"
// import VideoItem from "@/components/VideoItem"
// import { Heart, Bookmark, Send } from "lucide-react"
// type VideoRow = { id: string; playback_url: string; title: string | null; caption: string | null; created_at: string; video_likes?: { count?: number }[] }
// const PAGE = 10
// const POLL_MS = 6000
// const AHEAD = (() => { const v = Number(process.env.NEXT_PUBLIC_REELS_AHEAD || 1); return v === 2 ? 2 : 1 })()
// const LAST_ID_KEY = "reels:lastVideoId"
// ... (all previous logic was here)
*/
