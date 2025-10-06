"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error("Session error:", error)
      } finally {
        // メール認証の場合は少し遅延を持たせる
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const isEmailVerification = hashParams.get('type') === 'signup'
        console.log("Is email verification:", isEmailVerification)
        
        if (isEmailVerification) {
          setTimeout(() => setLoading(false), 500)
        } else {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email)
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed')
      }
      
      setUser(session?.user ?? null)
      
      // メール認証以外の場合はすぐにローディングを終了
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const isEmailVerification = hashParams.get('type') === 'signup'
      
      if (!isEmailVerification) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      console.log("Signing out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        throw error
      }
      console.log("Sign out successful")
    } catch (error) {
      console.error("Failed to sign out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}