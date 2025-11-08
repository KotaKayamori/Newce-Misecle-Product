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

// 通知ブロードキャストデータ
export type NotificationBroadcastData = {
  title: string
  body: string
}

