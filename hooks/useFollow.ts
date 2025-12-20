"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface FollowStats {
  followersCount: number
  followingCount: number
}

export function useFollow(targetUserId: string | null) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 })

  // フォロー状態とフォロワー/フォロー数を取得
  const loadFollowData = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // フォロワー数を取得（このユーザーをフォローしている人の数）
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId)

      if (followersError) throw followersError

      // フォロー数を取得（このユーザーがフォローしている人の数）
      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId)

      if (followingError) throw followingError

      setStats({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      })

      // 自分がこのユーザーをフォローしているかどうか
      if (user && user.id !== targetUserId) {
        const { data, error: isFollowingError } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .maybeSingle()

        if (isFollowingError) throw isFollowingError
        setIsFollowing(!!data)
      } else {
        setIsFollowing(false)
      }
    } catch (err) {
      console.error("Failed to load follow data:", err)
    } finally {
      setLoading(false)
    }
  }, [targetUserId, user])

  useEffect(() => {
    loadFollowData()
  }, [loadFollowData])

  // フォロー/アンフォロー切り替え
  const toggleFollow = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return

    try {
      if (isFollowing) {
        // アンフォロー
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)

        if (error) throw error
        setIsFollowing(false)
        setStats((prev) => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1),
        }))
      } else {
        // フォロー
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId })

        if (error) throw error
        setIsFollowing(true)
        setStats((prev) => ({
          ...prev,
          followersCount: prev.followersCount + 1,
        }))
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err)
      // エラー時は状態を再取得
      loadFollowData()
    }
  }, [user, targetUserId, isFollowing, loadFollowData])

  return {
    isFollowing,
    loading,
    followersCount: stats.followersCount,
    followingCount: stats.followingCount,
    toggleFollow,
    refreshFollowData: loadFollowData,
  }
}