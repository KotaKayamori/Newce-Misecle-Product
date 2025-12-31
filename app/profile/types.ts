/**
 * プロフィールページで使用する型定義
 */

// メール送信タイプ
export type EmailType = "contact" | "bug"

// プロフィール編集データ
export type ProfileEditData = {
  name: string
  username: string
  gender: string
  age: string
  profileImage: File | null
  profileImagePreview: string | null
}

// パスワード変更データ
export type PasswordChangeData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// 動画の型定義
export interface UserVideo {
  id: string
  owner_id: string
  playback_url: string
  storage_path: string
  title: string | null
  caption: string | null
  created_at: string
}

// アルバムの型定義
export interface UserAlbum {
  id: string
  owner_id: string
  title: string | null
  caption: string | null
  cover_path: string | null
  created_at: string
}
