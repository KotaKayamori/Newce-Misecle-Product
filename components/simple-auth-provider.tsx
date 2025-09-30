"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  // Mock user for development
  const [user] = useState<User>({
    id: "mock-user-id",
    email: "user@example.com",
    name: "テストユーザー",
  })
  const [loading] = useState(false)

  const signOut = async () => {
    // Mock sign out
    console.log("Sign out")
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}
