"use client"

import { useEffect } from "react"

export function useVisualViewportVars() {
  useEffect(() => {
    if (typeof window === "undefined") return
    let rafId = 0

    const update = () => {
      rafId = 0
      const vv = window.visualViewport
      const innerH = window.innerHeight
      const vvh = vv?.height ?? innerH
      const vvt = vv?.offsetTop ?? 0
      const vvb = Math.max(0, innerH - (vvh + vvt))

      const root = document.documentElement
      root.style.setProperty("--vvh", `${vvh}px`)
      root.style.setProperty("--vvt", `${vvt}px`)
      root.style.setProperty("--vvb", `${vvb}px`)
    }

    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(update)
    }

    schedule()
    const vv = window.visualViewport
    vv?.addEventListener("resize", schedule)
    vv?.addEventListener("scroll", schedule)
    window.addEventListener("resize", schedule)
    window.addEventListener("orientationchange", schedule)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      vv?.removeEventListener("resize", schedule)
      vv?.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("orientationchange", schedule)
    }
  }, [])
}
