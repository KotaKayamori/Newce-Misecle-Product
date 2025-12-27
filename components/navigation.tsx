"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Calendar, Heart, User } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { label: "探す", icon: Search, href: "/search" },
    { label: "予約履歴", icon: Calendar, href: "/reservations" },
    { label: "お気に入り", icon: Heart, href: "/favorites" },
    { label: "マイページ", icon: User, href: "/profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[70]">
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
