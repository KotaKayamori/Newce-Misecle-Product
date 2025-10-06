"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Eye, EyeOff, Lock, ArrowLeft, Check, X, User, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function AuthForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false) // メール認証画面
  const [registrationStep, setRegistrationStep] = useState<1 | 2>(1)
  const [resetMethod, setResetMethod] = useState<"username" | "phone">("username")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingEmail, setPendingEmail] = useState("") // 認証待ちのメールアドレス
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

  // URL パラメータをチェックして認証フローを処理
  useEffect(() => {
    const handleAuthFlow = async () => {
      // URLハッシュから認証情報を取得
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      console.log('AuthForm: URL parameters:', { type, accessToken: !!accessToken })

      if (type === 'signup' && accessToken) {
        console.log('AuthForm: Email verification detected, redirecting to register page')
        
        // /registerページにリダイレクト（ハッシュパラメータを含む）
        router.push(`/register${window.location.hash}`)
        return
      }
    }

    handleAuthFlow()
  }, [router])

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

      console.log("Attempting to sign up with:", registrationData.contact)

      const { data, error } = await supabase.auth.signUp({
        email: registrationData.contact,
        password: registrationData.password,
        options: {
          // リダイレクト先を/registerページに設定
          emailRedirectTo: `${window.location.origin}/register`
        }
      })

      console.log("Sign up result:", { data, error })

      if (error) throw error

      if (!data.user) {
        throw new Error("ユーザー登録に失敗しました")
      }

      // メール確認が必要な場合
      if (!data.session && data.user && !data.user.email_confirmed_at) {
        console.log("Email verification required")
        setPendingEmail(registrationData.contact)
        setShowEmailVerification(true)
        setShowRegistration(false)
        return
      }

      // メール確認が不要な場合（自動確認設定の場合）
      console.log("Registration completed, proceeding to name setup")
      setShowRegistration(false)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerificationEmail = async () => {
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`
        }
      })

      if (error) throw error

      alert("確認メールを再送信しました")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordValidation = registrationStep === 2 ? validatePassword(registrationData.password) : null
  const isPasswordValid = passwordValidation ? Object.values(passwordValidation).every(Boolean) : false

  // メール認証画面
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">メールを確認してください</h2>
            <p className="text-muted-foreground">
              <span className="font-medium">{pendingEmail}</span>
              <br />
              に確認メールを送信しました
            </p>
          </div>

          <Card className="bg-white border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  メール内のリンクをクリックして、アカウントの確認を完了してください。
                </p>
                
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12 border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                    {loading ? "送信中..." : "確認メールを再送信"}
                  </Button>

                  {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    // 最初のログイン画面に戻る
                    setShowEmailVerification(false)
                    setShowRegistration(false)
                    setRegistrationStep(1)
                    setPendingEmail("")
                    setRegistrationData({ contact: "", password: "" })
                    setError("")
                  }}
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
                      placeholder="メールアドレス"
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
              {/* <div className="flex justify-center space-x-8">
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
              </div> */}

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
            <img src="/images/misecle-mascot.png" alt="Misecle Logo" className="w-12 h-12" />
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
                  placeholder="メールアドレス"
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
                  新規登録
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