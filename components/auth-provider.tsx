"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInDemo: (email?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInDemo: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const demoEnabled =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true") ||
    (typeof process !== "undefined" && process.env.NODE_ENV !== "production")
  const DEMO_KEY = "misecle_demo_auth"

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // If no Supabase session and demo flag is set, use mock user
      if (!session?.user && demoEnabled && typeof window !== "undefined") {
        const stored = window.localStorage.getItem(DEMO_KEY)
        if (stored === "1") {
          const mock = {
            id: "demo-user",
            email: "demo@misecle.local",
            app_metadata: { provider: "email" },
            user_metadata: { name: "デモユーザー" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as User
          setUser(mock)
        }
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(DEMO_KEY)
          } catch {}
        }
        router.push("/profile")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(DEMO_KEY)
      } catch {}
    }
  }

  const signInDemo = async (email?: string) => {
    if (!demoEnabled) return
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(DEMO_KEY, "1")
      } catch {}
    }
    const mock = {
      id: "demo-user",
      email: email || "demo@misecle.local",
      app_metadata: { provider: "email" },
      user_metadata: { name: "デモユーザー" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as User
    setUser(mock)
    router.push("/search")
  }

  return <AuthContext.Provider value={{ user, loading, signOut, signInDemo }}>{children}</AuthContext.Provider>
}
