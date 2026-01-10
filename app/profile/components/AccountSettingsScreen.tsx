"use client"

import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface AccountSettingsScreenProps {
  onClose: () => void
  user: User | null
  onPasswordResetSuccess: () => void
}

export function AccountSettingsScreen({ onClose, user, onPasswordResetSuccess }: AccountSettingsScreenProps) {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
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
        description: "新しいパスワードが一致しません",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "パスワードエラー",
        description: "新しいパスワードは6文字以上で入力してください",
        variant: "destructive",
      })
      return
    }

    if (currentPassword === newPassword) {
      toast({
        title: "パスワードエラー",
        description: "現在のパスワードと同じパスワードは使用できません",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      })

      if (signInError) {
        toast({
          title: "認証エラー",
          description: "現在のパスワードが正しくありません",
          variant: "destructive",
        })
        setIsChangingPassword(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        toast({
          title: "パスワード変更失敗",
          description: updateError.message,
          variant: "destructive",
        })
      } else {
        onPasswordResetSuccess()
      }
    } catch (error) {
      console.error("Password change error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: "エラー",
        description: "メールアドレスが見つかりません",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast({
          title: "送信失敗",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "送信完了",
          description: `パスワード再設定メールを ${user.email} に送信しました`,
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" onClick={onClose} className="text-black">
          ＜
        </Button>
        <h1 className="text-xl font-semibold">アカウント設定</h1>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* パスワード変更フォーム */}
        <div>
          <h3 className="text-lg font-semibold mb-4">パスワード変更</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="現在のパスワードを入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="新しいパスワード（6文字以上）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新しいパスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="もう一度入力してください"
              />
            </div>
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
            >
              {isChangingPassword ? "変更中..." : "パスワードを変更"}
            </Button>
          </form>
        </div>

        {/* パスワードを忘れた場合 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">パスワードをお忘れですか？</h3>
          <p className="text-sm text-gray-600 mb-4">
            登録されているメールアドレスにパスワード再設定用のリンクを送信します。
          </p>
          <Button
            onClick={handlePasswordReset}
            variant="outline"
            className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 py-3 text-lg font-semibold"
          >
            パスワード再設定メールを送信
          </Button>
        </div>
      </div>
    </div>
  )
}

