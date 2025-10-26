"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // URLからセッション情報を取得
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          toast({
            title: "エラー",
            description: "無効なリセットリンクです。新しいパスワードリセットを申請してください。",
            variant: "destructive",
          })
          router.push('/auth/login')
          return
        }

        if (!data.session) {
          toast({
            title: "エラー",
            description: "セッションが見つかりません。新しいパスワードリセットを申請してください。",
            variant: "destructive",
          })
          router.push('/auth/login')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: "エラー",
          description: "予期しないエラーが発生しました。",
          variant: "destructive",
        })
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "パスワードが一致しません",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "パスワードエラー",
        description: "パスワードは6文字以上で入力してください",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password reset error:', error)
        toast({
          title: "更新エラー",
          description: error.message || "パスワードの更新に失敗しました",
          variant: "destructive",
        })
        return
      }

      setIsSuccess(true)
      
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error: any) {
      console.error('Password reset error:', error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">パスワード変更完了</h2>
            <p className="text-gray-600 leading-relaxed">
              パスワードが正常に変更されました。<br />
              自動的にログインページに移動します。
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              新しいパスワードでログインしてください。
            </p>
          </div>

          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
          >
            ログインページに移動
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">パスワードを再設定</h1>
          <p className="text-gray-600">新しいパスワードを入力してください</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="新しいパスワード（6文字以上）"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワードの確認
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="パスワードをもう一度入力"
              minLength={6}
              required
            />
          </div>

          {/* パスワード要件の表示 */}
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800 font-medium mb-1">パスワード要件:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-700' : ''}`}>
                <span className={newPassword.length >= 6 ? '✓' : '•'}>6文字以上</span>
              </li>
              <li className={`flex items-center gap-2 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-green-700' : ''}`}>
                <span className={newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '•'}>確認パスワードと一致</span>
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={isResetting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
          >
            {isResetting ? "更新中..." : "パスワードを更新"}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => router.push('/auth/login')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            ログインページに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}