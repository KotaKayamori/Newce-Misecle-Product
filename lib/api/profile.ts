import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  name: string
  username: string
  gender: '男性' | '女性' | 'その他'
  age: '10代' | '20代' | '30代' | '40代' | '50代以上'
  avatar_url?: string | null
  icon_choice?: 'preset' | 'upload' | 'later'
  created_at: string
  updated_at: string
}

/**
 * ユーザープロフィールを取得する
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  console.log("Fetching user profile for user:", userId)
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error("Profile fetch error:", error)
    if (error.code === 'PGRST116') {
      throw new Error('PROFILE_NOT_FOUND')
    }
    throw new Error(error.message || "プロフィールの取得に失敗しました")
  }

  console.log("User profile fetched:", profile)
  return profile
}

/**
 * ユーザープロフィールを更新する
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  console.log("Updating user profile:", updates)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error("Profile update error:", error)
    throw new Error(error.message || "プロフィールの更新に失敗しました")
  }

  console.log("Profile updated successfully:", data)
  return data
}

/**
 * ユーザープロフィールを作成する
 */
export async function createUserProfile(profileData: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile> {
  console.log("Creating user profile:", profileData)
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profileData)
    .select()
    .single()

  if (error) {
    console.error("Profile creation error:", error)
    if (error.code === "23505") {
      throw new Error("このユーザーネームは既に使用されています")
    }
    if (error.code === "42501") {
      throw new Error("データベースへのアクセス権限がありません")
    }
    throw new Error(error.message || "プロフィールの作成に失敗しました")
  }

  console.log("User profile created successfully:", data)
  return data
}

/**
 * ユーザープロフィールが存在するかチェックする
 */
export async function checkUserProfileExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error("Profile check error:", error)
    return false
  }

  return !!data
}

/**
 * ユーザーネームの重複チェック
 */
export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username)

  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') {
    console.error("Username check error:", error)
    return false
  }

  return !data // データが存在しない場合は利用可能
}