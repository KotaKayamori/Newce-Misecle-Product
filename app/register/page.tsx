"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Check, X, User, Upload, Camera } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { createUserProfile, checkUserProfileExists } from "@/lib/api/profile"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<'name' | 'icon' | 'survey'>('name')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  
  const [nameData, setNameData] = useState({
    name: "",
    username: "",
  })
  
  const [surveyData, setSurveyData] = useState({
    gender: "",
    age: "",
  })
  
  const [iconChoice, setIconChoice] = useState("")
  
  // 画像アップロード関連のstate
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // メール認証からのアクセスかチェック
  useEffect(() => {
    const checkEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')

      if (type === 'signup' && accessToken) { 
        // URLをクリーンアップ
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // 少し待機してセッションが確立されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 既存のプロフィールをチェック
        if (user) {
          const profileExists = await checkUserProfileExists(user.id)
          if (profileExists) {
            router.push('/search')
            return
          }
        }
      } else {
        // メール認証経由でない場合は、ログイン状態をチェック
        if (!loading && !user) {
          console.log('No user found, redirecting to login')
          router.push('/')
          return
        }
        
        if (!loading && user) {
          // プロフィールが既に存在するかチェック
          const profileExists = await checkUserProfileExists(user.id)
          if (profileExists) {
            console.log('Profile already exists, redirecting to search')
            router.push('/search')
            return
          }
        }
      }
    }

    if (!loading) {
      checkEmailVerification()
    }
  }, [user, loading, router])

  const handleNameInputChange = (field: string, value: string) => {
    setNameData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSurveyInputChange = (field: string, value: string) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNameSetupComplete = (e: React.FormEvent) => {
    e.preventDefault()
    if (nameData.name && nameData.username) {
      setCurrentStep('icon')
    }
  }

  // 画像選択ハンドラー
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setSelectedImage(file)
      setIconChoice("upload")
      setShowPhotoOptions(false)
      
      // プレビュー用のURL作成
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 画像をSupabase Storageにアップロード
  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // ファイル名を生成（ユーザーIDと現在時刻を使用してユニークにする）
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      console.log('Uploading image to:', filePath)

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw error
      }

      setUploadProgress(50)

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      console.log('Image uploaded successfully:', publicUrl)

      return publicUrl
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast({
        title: "アップロードエラー",
        description: "画像のアップロードに失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 画像削除ハンドラー
  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAvatarUrl(null)
    setIconChoice("")
    
    // input要素をリセット
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleIconSetupComplete = async () => {
    // 画像がアップロードされている場合は、Storageにアップロード
    if (selectedImage && user && iconChoice === "upload") {
      const uploadedUrl = await uploadImageToStorage(selectedImage, user.id)
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl)
      } else {
        // アップロードに失敗した場合は、iconChoiceをリセット
        setIconChoice("")
        return
      }
    }

    setCurrentStep('survey')
  }

  const handleRegistrationComplete = async () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("Starting user profile creation...")
      
      if (!user) {
        throw new Error("ユーザー認証の確認に失敗しました。一度ログアウトして再度ログインしてください。")
      }

      // データを準備
      const profileData = {
        id: user.id,
        name: nameData.name.trim(),
        username: nameData.username.trim(),
        gender: surveyData.gender as '男性' | '女性' | 'その他',
        age: surveyData.age as '10代' | '20代' | '30代' | '40代' | '50代以上',
        icon_choice: (iconChoice || "later") as 'preset' | 'upload' | 'later',
        avatar_url: avatarUrl, // アップロードされた画像のURLを追加
      }

      console.log("Profile data to create:", profileData)

      // プロフィールを作成
      await createUserProfile(profileData)

      console.log("User profile created successfully")

      // メインアプリに移動
      router.push("/search")
    } catch (error: any) {
      console.error("Profile creation error:", error)
      setError(error.message || "プロフィールの作成中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // 名前設定画面
  if (currentStep === 'name') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">プロフィールの設定</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleNameSetupComplete} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    名前
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="ミセクルユーザー"
                    value={nameData.name}
                    onChange={(e) => handleNameInputChange("name", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-foreground">
                    ユーザーネーム
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Misecle_Users"
                    value={nameData.username}
                    onChange={(e) => handleNameInputChange("username", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <Button
                  type="submit"
                  disabled={!nameData.name || !nameData.username}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                >
                  次へ
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              from
              <br />
              <span className="font-medium">Newce</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // アイコン設定画面
  if (currentStep === 'icon') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">プロフィール写真の設定</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col items-center space-y-6">
                {/* プロフィール画像プレビュー */}
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="プロフィール画像プレビュー"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* 選択された画像の情報表示 */}
                {selectedImage && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">{selectedImage.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedImage.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      画像を削除
                    </button>
                  </div>
                )}

                {/* アップロード進行状況 */}
                {isUploading && (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>アップロード中...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {!showPhotoOptions ? (
                  <div className="space-y-4 w-full">
                    <button
                      type="button"
                      onClick={() => setShowPhotoOptions(true)}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      プロフィール写真を設定
                    </button>

                    <button
                      type="button"
                      onClick={() => setIconChoice("later")}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors"
                    >
                      後で設定する
                    </button>

                    <Button
                      type="button"
                      onClick={handleIconSetupComplete}
                      disabled={!iconChoice || isUploading}
                      className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {isUploading ? "アップロード中..." : "次へ"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {/* ファイルアップロードボタン */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="avatar-upload"
                        onChange={handleImageSelect}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="w-full cursor-pointer text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors flex items-center justify-center gap-2 border border-dashed border-orange-300 rounded-lg hover:border-orange-400"
                      >
                        <Upload className="w-5 h-5" />
                        ファイルから選ぶ
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIconChoice("preset")
                        setShowPhotoOptions(false)
                      }}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-5 h-5" />
                      デフォルトアバターを使用
                    </button>

                    <Button
                      type="button"
                      onClick={() => setShowPhotoOptions(false)}
                      className="w-full h-12 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-base"
                    >
                      戻る
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setCurrentStep('name')
                    setIconChoice("")
                    handleImageRemove()
                  }}
                  className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              from
              <br />
              <span className="font-medium">Newce</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // アンケート画面
  if (currentStep === 'survey') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">性別と年齢を設定する</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-6">
                {/* プロフィール画像プレビュー（確認用） */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="プロフィール画像"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">性別</h3>
                  <div className="space-y-3">
                    {["男性", "女性", "その他"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => handleSurveyInputChange("gender", gender)}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            surveyData.gender === gender ? "border-orange-500 bg-orange-500" : "border-gray-300"
                          }`}
                        >
                          {surveyData.gender === gender && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-base text-foreground">{gender}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">年齢</h3>
                  <div className="space-y-3">
                    {["10代", "20代", "30代", "40代", "50代以上"].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => handleSurveyInputChange("age", age)}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            surveyData.age === age ? "border-orange-500 bg-orange-500" : "border-gray-300"
                          }`}
                        >
                          {surveyData.age === age && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-base text-foreground">{age}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <Button
                  type="button"
                  onClick={handleRegistrationComplete}
                  disabled={!surveyData.gender || !surveyData.age || isLoading}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isLoading ? "作成中..." : "アカウントを作成"}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setCurrentStep('icon')
                    setSurveyData({ gender: "", age: "" })
                  }}
                  className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  戻る
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              from
              <br />
              <span className="font-medium">Newce</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}