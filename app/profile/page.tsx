"use client"

import AuthedMyPage from "./AuthedMyPage"
import { useAuth } from "@/components/auth-provider"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"

export default function MyPageScreen() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-700">Loading...</span>
      </div>
    )
  }

  if (user) return <AuthedMyPage />

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="text-gray-900 mb-6">現在アカウントにログインしていません。</p>
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="w-full max-w-xs rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 mx-auto"
        >
          ログインする
        </button>
      </div>
      <Navigation />
    </div>
  )
}
