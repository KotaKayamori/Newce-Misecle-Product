"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AuthForm } from "@/components/auth-form"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    const handleEmailVerification = async () => {
      // URLハッシュから認証情報を確認
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')

      // メール認証からのアクセスの場合は、/registerにリダイレクト
      if (type === 'signup' && accessToken) {
        console.log('Email verification detected on home page, redirecting to register')
        router.push(`/register${window.location.hash}`)
        return
      }

      // 通常のログイン状態チェック
      if (!loading && user) {
        console.log('User is logged in, redirecting to search')
        router.replace("/search")
      }
      
      // ログアウト状態の場合はログインフォームを表示
      if (!loading && !user) {
        console.log('User is not logged in, showing login form')
      }
    }

    handleEmailVerification()
  }, [user, loading, router])

  // ローディング中は何も表示しない
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // メール認証パラメータがある場合は、AuthFormで処理
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const isEmailVerification = hashParams.get('type') === 'signup' && hashParams.get('access_token')

  // ログイン済みでメール認証でない場合はnullを返す（useEffectでリダイレクトされる）
  if (user && !isEmailVerification) {
    return null
  }

  // 未ログインまたはメール認証の場合はAuthFormを表示
  return <AuthForm />
}
