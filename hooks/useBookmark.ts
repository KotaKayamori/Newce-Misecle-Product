"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useBookmark() {
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // ブックマーク状態を取得
  const fetchBookmarkStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) return

      const response = await fetch('/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const videoIds = data.bookmarks.map((bookmark: any) => bookmark.videos.id)
        setBookmarkedVideoIds(new Set(videoIds))
      }
    } catch (error) {
      console.error('Failed to fetch bookmark status:', error)
    }
  }, [])

  // ブックマークをトグル
  const toggleBookmark = useCallback(async (videoId: string) => {
    if (loading) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('ログインが必要です')
      }

      // 楽観的更新
      const wasBookmarked = bookmarkedVideoIds.has(videoId)
      setBookmarkedVideoIds(prev => {
        const next = new Set(prev)
        if (wasBookmarked) {
          next.delete(videoId)
        } else {
          next.add(videoId)
        }
        return next
      })

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      })

      if (!response.ok) {
        // エラー時はロールバック
        setBookmarkedVideoIds(prev => {
          const next = new Set(prev)
          if (wasBookmarked) {
            next.add(videoId)
          } else {
            next.delete(videoId)
          }
          return next
        })
        throw new Error('ブックマークの更新に失敗しました')
      }

      const data = await response.json()
      setBookmarkedVideoIds(prev => {
        const next = new Set(prev)
        if (data.bookmarked) {
          next.add(videoId)
        } else {
          next.delete(videoId)
        }
        return next
      })

    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [bookmarkedVideoIds, loading])

  useEffect(() => {
    fetchBookmarkStatus()
  }, [fetchBookmarkStatus])

  return {
    bookmarkedVideoIds,
    loading,
    toggleBookmark,
    refetch: fetchBookmarkStatus
  }
}