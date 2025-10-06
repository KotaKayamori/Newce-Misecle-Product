import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { fetchUserProfile, updateUserProfile, UserProfile } from '@/lib/api/profile'

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // プロフィール取得
  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error)
      if (error.message === 'PROFILE_NOT_FOUND') {
        setError('PROFILE_NOT_FOUND')
      } else {
        setError(error.message || "プロフィールの取得に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  // プロフィール更新
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return false

    setError("")

    try {
      const updatedProfile = await updateUserProfile(user.id, updates)
      setUserProfile(updatedProfile)
      return true
    } catch (error: any) {
      console.error("Failed to update user profile:", error)
      setError(error.message || "プロフィールの更新に失敗しました")
      return false
    }
  }

  // プロフィール再読み込み
  const refreshProfile = () => {
    loadProfile()
  }

  // 初期化
  useEffect(() => {
    if (!authLoading && user) {
      loadProfile()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  return {
    userProfile,
    loading: loading || authLoading,
    error,
    updateProfile,
    refreshProfile,
  }
}