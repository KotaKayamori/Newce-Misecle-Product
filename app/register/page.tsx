"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Check, X, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import { createUserProfile, checkUserProfileExists } from "@/lib/api/profile"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
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

  // メール認証からのアクセスかチェック
  useEffect(() => {
    const checkEmailVerification = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')

      if (type === 'signup' && accessToken) {
        console.log('Email verification detected on register page')
        
        // URLをクリーンアップ
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // 少し待機してセッションが確立されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 既存のプロフィールをチェック
        if (user) {
          const profileExists = await checkUserProfileExists(user.id)
          if (profileExists) {
            console.log('Profile already exists, redirecting to search')
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

  const handleIconSetupComplete = () => {
    console.log("Icon setup completed:", iconChoice)
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
        icon_choice: iconChoice || "later",
      }

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
            <h2 className="text-2xl font-bold text-foreground mb-8">アイコンの設定</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>

                {!showPhotoOptions ? (
                  <div className="space-y-4 w-full">
                    <button
                      type="button"
                      onClick={() => setShowPhotoOptions(true)}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors"
                    >
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
                      disabled={!iconChoice}
                      className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      次へ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setIconChoice("preset")
                        setShowPhotoOptions(false)
                      }}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors"
                    >
                      写真から選ぶ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIconChoice("upload")
                        setShowPhotoOptions(false)
                      }}
                      className="w-full text-center py-3 text-orange-500 hover:text-orange-600 font-medium text-base transition-colors"
                    >
                      ファイルから選ぶ
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