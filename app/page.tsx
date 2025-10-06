"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AuthForm } from "@/components/auth-form"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/search")
    }
  }, [user, loading, router])

  // ローディング中は何も表示しない
  if (loading) {
    return null
  }

  // ログイン済みの場合はnullを返す（useEffectでリダイレクトされる）
  if (user) {
    return null
  }

  // 未ログインの場合はAuthFormを表示
  return <AuthForm />
}
