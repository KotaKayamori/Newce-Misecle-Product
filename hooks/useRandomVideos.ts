"use client"

import { useState, useEffect, useCallback } from 'react'

export interface VideoData {
  id: string
  title: string
  category: string
  public_url: string
  caption?: string
  store_info?: string | null
  created_at: string
  user: {
    id: string
    name: string
    username: string
    avatar_url?: string
  }
}

export function useRandomVideos() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async (category?: string, limit: number = 10) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      if (category) {
        params.set('category', category)
      }

      const response = await fetch(`/api/videos/random?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshVideos = useCallback((category?: string, limit: number = 10) => {
    fetchVideos(category, limit)
  }, [fetchVideos])

  return {
    videos,
    loading,
    error,
    fetchVideos,
    refreshVideos
  }
}
