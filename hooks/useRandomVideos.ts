"use client"

import { useState, useEffect, useCallback } from 'react'

export interface VideoData {
  id: string
  owner_id?: string | null
  title: string
  categories?: string[] | null
  public_url: string
  caption?: string | null
  store_info?: string | null
  created_at: string
  user: {
    id: string | null
    name: string | null
    username: string | null
    avatar_url?: string | null
  }
  store_1_name?: string | null
  store_1_tel?: string | null
  store_1_tabelog?: string | null
  store_2_name?: string | null
  store_2_tel?: string | null
  store_2_tabelog?: string | null
  store_3_name?: string | null
  store_3_tel?: string | null
  store_3_tabelog?: string | null
}

export function useRandomVideos() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // offsetを追加
  const fetchVideos = useCallback(async (category?: string, limit: number = 10, offset: number = 0) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())
      if (category) {
        params.set('category', category)
      }

      const response = await fetch(`/api/videos/random?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()
      // 追加取得時はsetVideosしない（呼び出し元で管理）
      return data.videos || []
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshVideos = useCallback((category?: string, limit: number = 10) => {
    fetchVideos(category, limit, 0).then((newVideos) => {
      setVideos(newVideos)
    })
  }, [fetchVideos])

  return {
    videos,
    loading,
    error,
    fetchVideos,
    refreshVideos
  }
}