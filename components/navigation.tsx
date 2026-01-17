"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Calendar, Heart, User } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useVisualViewportVars } from "@/hooks/useVisualViewportVars"

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  useVisualViewportVars()

  const [bottomClass, setBottomClass] = useState("bottom-0")
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentIndexRef = useRef(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const vvb = getComputedStyle(document.documentElement).getPropertyValue("--vvb").trim()
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

  // ピル型背景の位置を計算する関数
  const updatePillPosition = (index: number) => {
    if (!navRef.current) return
    const itemWidth = navRef.current.offsetWidth / navItems.length
    const padding = 8
    setPillStyle({
      left: index * itemWidth + padding,
      width: itemWidth - padding * 2,
    })
  }

  // 初期マウント時とリサイズ時のピル型背景位置の更新
  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => pathname === item.href)
    const newIndex = activeIndex >= 0 ? activeIndex : 0
    currentIndexRef.current = newIndex

    // 初期化時は少し遅延させてDOMが確実に描画されてから計算
    if (!isInitializedRef.current) {
      const timer = setTimeout(() => {
        updatePillPosition(newIndex)
        isInitializedRef.current = true
      }, 50)
      return () => clearTimeout(timer)
    } else {
      updatePillPosition(newIndex)
    }
  }, [pathname])

  // リサイズ時の対応
  useEffect(() => {
    if (!isInitializedRef.current) return

    const handleResize = () => {
      updatePillPosition(currentIndexRef.current)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 長押しとスライド機能
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    
    longPressTimerRef.current = setTimeout(() => {
      setIsDragging(true)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimerRef.current && !isDragging) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
      return
    }

    if (!isDragging || !navRef.current) return

    const touch = e.touches[0]
    const rect = navRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const itemWidth = rect.width / navItems.length
    const index = Math.max(0, Math.min(navItems.length - 1, Math.floor(x / itemWidth)))

    if (index !== currentIndexRef.current) {
      currentIndexRef.current = index
      updatePillPosition(index)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (isDragging) {
      setIsDragging(false)
      const selectedItem = navItems[currentIndexRef.current]
      if (selectedItem && pathname !== selectedItem.href) {
        router.push(selectedItem.href)
      }
    }
  }

  useEffect(() => {
    if (!navRef.current || typeof window === "undefined") return
    const update = () => {
      const h = navRef.current!.offsetHeight
      document.documentElement.style.setProperty("--footer-h", `${h}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(navRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <nav 
      ref={navRef}
      className={`global-footer fixed left-2 right-2 ${bottomClass} border border-white/20 z-[70] pb-[env(safe-area-inset-bottom)] rounded-3xl mb-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]
        bg-white/40 backdrop-blur-xl backdrop-saturate-150
        ${isDragging ? 'bg-white/30' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative flex">
        {/* ピル型背景 */}
        <div
          className={`absolute top-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-out
            ${isDragging ? 'bg-gray-400/20' : 'bg-gray-300/40'}`}
          style={{
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
          }}
        />

        {navItems.map((item, index) => {
          const IconComponent = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              scroll={false}
              replace={false}
              className={`relative flex-1 flex flex-col items-center py-2 px-1 transition-colors duration-150 z-10
                ${isActive ? "text-orange-500" : "text-gray-700 hover:text-gray-900"}`}
            >
              <IconComponent className={`w-5 h-5 mb-1 ${isActive ? "text-orange-500" : ""}`} />
              <span className={`text-xs ${isActive ? "text-orange-500 font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}