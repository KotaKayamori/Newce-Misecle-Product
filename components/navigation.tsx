"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Calendar, Heart, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useVisualViewportVars } from "@/hooks/useVisualViewportVars"

export default function Navigation() {
  const pathname = usePathname()
  useVisualViewportVars()

  const [bottomClass, setBottomClass] = useState("bottom-0")

  useEffect(() => {
    if (typeof window === "undefined") return
    // --vvb
    const vvb = getComputedStyle(document.documentElement).getPropertyValue("--vvb").trim()
    // env(safe-area-inset-bottom)は直接取得できないので、0px以外ならvvbと同じ扱い
    // ここではvvbだけで判定（多くのケースで十分）
    if (vvb && vvb !== "0px") {
      setBottomClass("bottom-[calc(env(safe-area-inset-bottom)+var(--vvb))]")
    } else {
      setBottomClass("bottom-0")
    }
  }, [])

  const navItems = [
    { label: "ホーム", icon: Home, href: "/search" },
    { label: "予約履歴", icon: Calendar, href: "/reservations" },
    { label: "お気に入り", icon: Heart, href: "/favorites" },
    { label: "マイページ", icon: User, href: "/profile" },
  ]

  return (
    <nav className={`fixed left-0 right-0 ${bottomClass} bg-white border-t border-gray-200 z-[70] pb-[env(safe-area-inset-bottom)]`}>
      <div className="flex">
        {navItems.map((item) => {
          const IconComponent = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              scroll={false}
              replace={false}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors duration-150 ${
                isActive ? "text-orange-500" : "text-gray-600 hover:text-black"
              }`}
            >
              <IconComponent className={`w-5 h-5 mb-1 ${isActive ? "text-orange-500" : ""}`} />
              <span className={`text-xs ${isActive ? "text-orange-500 font-medium" : ""}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
