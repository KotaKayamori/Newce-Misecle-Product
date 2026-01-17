import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/components/auth-provider"
import Navigation from "@/components/navigation"
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css"

export const metadata: Metadata = {
  title: "ミセクル（Misecle）｜ショート動画型グルメ予約サービス",
  description: "ショート動画型グルメ予約サービス",
  generator: "Misecle Web App",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
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
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <AuthProvider>
          {children}
          <Navigation />
        </AuthProvider>
      </body>
    </html>
  )
}
