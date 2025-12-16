"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"

interface UserProfile {
  name?: string | null
  username?: string | null
  avatar_url?: string | null
  gender?: string | null
  age?: string | null
  profile?: string | null
  created_at?: string
}

interface ProfileEditScreenProps {
  onClose: () => void
  userProfile: UserProfile | null
  userId: string | null
  onUpdate: (updates: any) => Promise<boolean>
  onOpenGenderAge: () => void
}

export function ProfileEditScreen({
  onClose,
  userProfile,
  userId,
  onUpdate,
  onOpenGenderAge,
}: ProfileEditScreenProps) {
  const { toast } = useToast()
  const [editedName, setEditedName] = useState("")
  const [editedUsername, setEditedUsername] = useState("")
  const [editedProfile, setEditedProfile] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [profileUploadProgress, setProfileUploadProgress] = useState<number>(0)

  const PROFILE_MAX_LENGTH = 150

  useEffect(() => {
    if (userProfile) {
      setEditedName(userProfile.name || "")
      setEditedUsername(userProfile.username || "")
      setEditedProfile(userProfile.profile || "")
    }
  }, [userProfile])

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ファイルサイズエラー",
          description: "画像ファイルは5MB以下にしてください。",
          variant: "destructive",
        })
        return
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "ファイル形式エラー",
          description: "JPEG、PNG、GIF、WebP形式の画像ファイルを選択してください。",
          variant: "destructive",
        })
        return
      }

      setSelectedProfileImage(file)
      
      // プレビュー用のURL作成
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileImageRemove = () => {
    setSelectedProfileImage(null)
    setProfileImagePreview(null)
    
    const fileInput = document.getElementById('profile-image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const uploadProfileImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploadingProfile(true)
      setProfileUploadProgress(0)

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-profile-${Date.now()}.${fileExt}`
      const filePath = fileName

      setProfileUploadProgress(20)

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        throw new Error(`アップロードエラー: ${error.message}`)
      }

      setProfileUploadProgress(70)

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfileUploadProgress(100)

      return publicUrl
    } catch (error: any) {
      toast({
        title: "アップロードエラー",
        description: error.message || "画像のアップロードに失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploadingProfile(false)
      setProfileUploadProgress(0)
    }
  }

  const handleSaveProfile = async () => {
    const updates: any = {
      name: editedName.trim(),
      username: editedUsername.trim(),
      profile: editedProfile.trim(),
    }

    if (!updates.name || !updates.username) {
      toast({
        title: "入力エラー",
        description: "名前とユーザーネームを入力してください",
        variant: "destructive",
      })
      return
    }

    if (editedProfile.length > PROFILE_MAX_LENGTH) {
      toast({
        title: "入力エラー",
        description: `自己紹介は${PROFILE_MAX_LENGTH}文字以内で入力してください`,
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    
    try {
      if (selectedProfileImage && userId) {
        const uploadedUrl = await uploadProfileImageToStorage(selectedProfileImage, userId)
        if (uploadedUrl) {
          updates.avatar_url = uploadedUrl
        } else {
          setIsUpdating(false)
          return
        }
      }

      const success = await onUpdate(updates)
      
      if (success) {
        toast({
          title: "更新完了",
          description: "プロフィールを更新しました",
        })
        
        setSelectedProfileImage(null)
        setProfileImagePreview(null)
        onClose()
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "更新エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="text-black">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold flex-1 text-center">プロフィール</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-6 py-4 space-y-6">
        <div className="space-y-6">
          {/* Profile Icon with Upload */}
          <div className="text-center">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profileImagePreview || userProfile?.avatar_url || "/images/misecle-mascot.png"}
                alt="Profile Icon"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
              />
              
              {selectedProfileImage && (
                <button
                  type="button"
                  onClick={handleProfileImageRemove}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {selectedProfileImage && (
              <div className="text-center space-y-1 mb-2">
                <p className="text-xs text-gray-600">{selectedProfileImage.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedProfileImage.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            )}

            {isUploadingProfile && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>アップロード中...</span>
                  <span>{Math.round(profileUploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileUploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="profile-image-upload"
                onChange={handleProfileImageSelect}
              />
              <label
                htmlFor="profile-image-upload"
                className="text-blue-600 hover:text-blue-700 transition-colors text-sm cursor-pointer"
              >
                写真を設定
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={userProfile?.name || "名前を入力してください"}
            />
          </div>
          
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーネーム</label>
            <input
              type="text"
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={userProfile?.username || "ユーザーネームを入力してください"}
            />
          </div>

          {/* Profile (自己紹介) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">自己紹介</label>
              <span className={`text-xs ${editedProfile.length > PROFILE_MAX_LENGTH ? 'text-red-500' : 'text-gray-500'}`}>
                {editedProfile.length}/{PROFILE_MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={editedProfile}
              onChange={(e) => setEditedProfile(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
                editedProfile.length > PROFILE_MAX_LENGTH ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={userProfile?.profile || "自己紹介を入力してください"}
            />
            {editedProfile.length > PROFILE_MAX_LENGTH && (
              <p className="text-xs text-red-500 mt-1">
                文字数が上限を超えています
              </p>
            )}
          </div>

          {/* Gender and Age */}
          <div>
            <button
              onClick={onOpenGenderAge}
              className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-left"
              type="button"
            >
              <div>
                <p className="font-medium text-gray-800">性別と年齢</p>
                <p className="text-sm text-gray-500">
                  {userProfile?.gender && userProfile?.age 
                    ? `${userProfile.gender} • ${userProfile.age}`
                    : "未設定 - 公開プロフィールには表示されません"
                  }
                </p>
              </div>
              <span className="text-black">＞</span>
            </button>
          </div>

          {/* Account Created Date */}
          {userProfile?.created_at && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                アカウント作成日: {new Date(userProfile.created_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSaveProfile}
            disabled={isUpdating || isUploadingProfile || !editedName.trim() || !editedUsername.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
          >
            {isUpdating ? "保存中..." : isUploadingProfile ? "アップロード中..." : "保存する"}
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

