"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useLike(videoId: string) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // いいね状態を取得
  const fetchLikeStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch(`/api/videos/${videoId}/likes`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.isLiked)
        setLikeCount(data.count)
      }
    } catch (error) {
      console.error('Failed to fetch like status:', error)
    }
  }, [videoId])

  // いいねをトグル
  const toggleLike = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('ログインが必要です')
      }

      // 楽観的更新
      const wasLiked = isLiked
      setIsLiked(!wasLiked)
      setLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

      const response = await fetch(`/api/videos/${videoId}/likes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // エラー時はロールバック
        setIsLiked(wasLiked)
        setLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
        throw new Error('いいねの更新に失敗しました')
      }

      const data = await response.json()
      setIsLiked(data.liked)

      // 正確な数を再取得
      await fetchLikeStatus()

    } catch (error) {
      console.error('Failed to toggle like:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [videoId, isLiked, loading, fetchLikeStatus])

  useEffect(() => {
    fetchLikeStatus()
  }, [fetchLikeStatus])

  return {
    isLiked,
    likeCount,
    loading,
    toggleLike,
    refetch: fetchLikeStatus
  }
}