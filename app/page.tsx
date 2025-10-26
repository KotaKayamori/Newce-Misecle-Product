"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.slice(1))
    const type = hashParams.get("type")
    const accessToken = hashParams.get("access_token")
    const code = new URLSearchParams(window.location.search).get("code")

    // メール認証（サインアップ確認）: /register に誘導
    if (type === "signup" && (accessToken || code)) {
      router.push(`/register${hash}`)
      return
    }

    // パスワードリカバリー: /auth/reset-password に誘導（保険）
    if (type === "recovery") {
      router.push(`/auth/reset-password${hash}`)
      return
    }

    // それ以外は常に /search へ
    router.replace("/search")
  }, [router])

  return null
}