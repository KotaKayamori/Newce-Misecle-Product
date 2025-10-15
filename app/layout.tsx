import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Misecle - レストラン予約アプリ",
  description: "簡単にレストランを検索・予約できるアプリ",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabaseOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL as string).origin
    } catch {
      return undefined
    }
  })()
  return (
    <html lang="ja" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className={GeistSans.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
