"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Eye, EyeOff, Lock, ArrowLeft, Check, X, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function AuthForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showNameSetup, setShowNameSetup] = useState(false) // Added name setup state
  const [showIconSetup, setShowIconSetup] = useState(false)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false) // Added photo options state
  const [showSurvey, setShowSurvey] = useState(false)
  const [registrationStep, setRegistrationStep] = useState<1 | 2>(1)
  const [resetMethod, setResetMethod] = useState<"username" | "phone">("username")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    loginField: "",
    password: "",
  })
  const [resetData, setResetData] = useState({
    resetField: "",
  })
  const [registrationData, setRegistrationData] = useState({
    contact: "",
    password: "",
  })
  const [nameData, setNameData] = useState({
    name: "",
    username: "",
  })
  const [surveyData, setSurveyData] = useState({
    gender: "",
    age: "",
  })
  const [iconChoice, setIconChoice] = useState("")

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleResetInputChange = (field: string, value: string) => {
    setResetData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegistrationInputChange = (field: string, value: string) => {
    setRegistrationData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSurveyInputChange = (field: string, value: string) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNameInputChange = (field: string, value: string) => {
    setNameData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // メールアドレスかどうかをチェック
      const isEmail = formData.loginField.includes("@")
      
      if (!isEmail) {
        throw new Error("現在はメールアドレスでのログインのみサポートしています")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.loginField,
        password: formData.password,
      })

      if (error) throw error

      // ログイン成功後は自動的にリダイレクトされる
      router.push("/search")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetData.resetField)
      
      if (error) throw error

      alert(`パスワードリセットリンクを${resetData.resetField}に送信しました`)
      setShowPasswordReset(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrationStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (registrationData.contact) {
      setRegistrationStep(2)
    }
  }

  const handleRegistrationStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validatePassword(registrationData.password)
    const isPasswordValid = Object.values(validation).every(Boolean)

    if (!isPasswordValid) {
      setError("パスワードが条件を満たしていません")
      return
    }

    setLoading(true)
    setError("")

    try {
      // メールアドレスかどうかをチェック
      const isEmail = registrationData.contact.includes("@")
      
      if (!isEmail) {
        throw new Error("現在はメールアドレスでの登録のみサポートしています")
      }

      const { data, error } = await supabase.auth.signUp({
        email: registrationData.contact,
        password: registrationData.password,
      })

      if (error) throw error

      // ユーザープロフィールの作成は後で行う
      setShowNameSetup(true)
      setShowRegistration(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNameSetupComplete = (e: React.FormEvent) => {
    e.preventDefault()
    if (nameData.name && nameData.username) {
      setShowIconSetup(true)
      setShowNameSetup(false)
    }
  }

  const handleIconSetupComplete = () => {
    console.log("Icon setup completed:", iconChoice)
    setShowSurvey(true)
    setShowIconSetup(false)
  }

  const handleSurveyComplete = async () => {
    setLoading(true)
    setError("")

    try {
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // ユーザープロフィールを作成
        const { error } = await supabase.from("user_profiles").insert({
          id: user.id,
          name: nameData.name,
          username: nameData.username,
          gender: surveyData.gender,
          age: surveyData.age,
        })

        if (error) throw error
      }

      // メインアプリに移動
      router.push("/search")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordValidation = registrationStep === 2 ? validatePassword(registrationData.password) : null
  const isPasswordValid = passwordValidation ? Object.values(passwordValidation).every(Boolean) : false

  if (showNameSetup) {
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

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base"
                >
                  次へ
                </Button>
              </form>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowNameSetup(false)
                    setShowRegistration(true)
                    setRegistrationStep(2)
                    setNameData({ name: "", username: "" })
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

  // Icon setup screen
  if (showIconSetup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">アイコンの設定</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              {/* Circular icon placeholder */}
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
                    setShowIconSetup(false)
                    setShowNameSetup(true)
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

  if (showSurvey) {
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
                  onClick={handleSurveyComplete}
                  disabled={!surveyData.gender || !surveyData.age || loading}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {loading ? "作成中..." : "アカウントを作成"}
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowSurvey(false)
                    setShowIconSetup(true)
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

  if (showRegistration) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {registrationStep === 1 ? "アカウントの作成" : "パスワードの設定"}
            </h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              {registrationStep === 1 ? (
                <form onSubmit={handleRegistrationStep1Submit} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="contact"
                      type="text"
                      placeholder="電話番号、またはメールアドレス"
                      value={registrationData.contact}
                      onChange={(e) => handleRegistrationInputChange("contact", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  {error && registrationStep === 1 && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {loading ? "確認中..." : "次へ"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegistrationStep2Submit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="registrationPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="パスワードを入力"
                        value={registrationData.password}
                        onChange={(e) => handleRegistrationInputChange("password", e.target.value)}
                        className="h-12 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {passwordValidation && (
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">パスワードの条件:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordValidation.length ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${passwordValidation.length ? "text-green-600" : "text-red-600"}`}>
                            8文字以上
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordValidation.uppercase ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm ${passwordValidation.uppercase ? "text-green-600" : "text-red-600"}`}
                          >
                            大文字を含む
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordValidation.lowercase ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`text-sm ${passwordValidation.lowercase ? "text-green-600" : "text-red-600"}`}
                          >
                            小文字を含む
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordValidation.number ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${passwordValidation.number ? "text-green-600" : "text-red-600"}`}>
                            数字を含む
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordValidation.symbol ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${passwordValidation.symbol ? "text-green-600" : "text-red-600"}`}>
                            記号を含む
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                  )}

                  <Button
                    type="submit"
                    disabled={!isPasswordValid || loading}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {loading ? "登録中..." : "次へ"}
                  </Button>
                </form>
              )}

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    if (registrationStep === 2) {
                      setRegistrationStep(1)
                    } else {
                      setShowRegistration(false)
                      setRegistrationStep(1)
                      setRegistrationData({ contact: "", password: "" }) // Updated reset for single contact field
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {registrationStep === 2 ? "戻る" : "ログイン画面に戻る"}
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

  // Password reset modal view
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-8">ログイン出来ない場合</h2>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              {/* Method Toggle */}
              <div className="flex justify-center space-x-8">
                <button
                  type="button"
                  onClick={() => setResetMethod("username")}
                  className={`text-base font-medium text-foreground pb-3 px-2 border-b-2 transition-colors ${
                    resetMethod === "username" ? "border-foreground" : "border-transparent"
                  }`}
                >
                  メールアドレス
                </button>
                <button
                  type="button"
                  onClick={() => setResetMethod("phone")}
                  className={`text-base font-medium text-foreground pb-3 px-2 border-b-2 transition-colors ${
                    resetMethod === "phone" ? "border-foreground" : "border-transparent"
                  }`}
                >
                  電話番号
                </button>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="resetField"
                    type="text"
                    placeholder={resetMethod === "username" ? "メールアドレスを入力" : "電話番号を入力"}
                    value={resetData.resetField}
                    onChange={(e) => handleResetInputChange("resetField", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base"
                >
                  ログインリンクを送信
                </Button>
              </form>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowPasswordReset(false)}
                  className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  ログイン画面に戻る
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src="/images/misecle-logo.png" alt="Misecle Logo" className="w-12 h-12" />
            <h1 className="text-5xl font-bold text-foreground">Misecle</h1>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-white border-0 shadow-none">
          <CardHeader className="space-y-1 pb-4"></CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login Form */}
              <div className="space-y-2">
                <Input
                  id="loginField"
                  type="text"
                  placeholder="電話番号、またはメールアドレス"
                  value={formData.loginField}
                  onChange={(e) => handleInputChange("loginField", e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-12 pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base disabled:bg-gray-300 disabled:text-gray-500"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </Button>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="text-orange-500 hover:text-orange-600 p-0 h-auto font-normal"
                  onClick={() => setShowPasswordReset(true)}
                >
                  パスワードを忘れた場合
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                アカウントをお持ちでないですか？{" "}
                <Button
                  type="button"
                  variant="link"
                  className="text-orange-500 hover:text-orange-600 p-0 h-auto font-normal"
                  onClick={() => setShowRegistration(true)}
                >
                  登録する
                </Button>
              </div>
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