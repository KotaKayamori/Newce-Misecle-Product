"use client"

import { useEffect, useRef } from "react"

function useStageViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return
    let rafId = 0
    const update = () => {
      rafId = 0
      const vv = window.visualViewport
      const height = vv?.height ?? window.innerHeight
      document.documentElement.style.setProperty("--stage-h", `${height}px`)
    }
    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(update)
    }
    schedule()
    const vv = window.visualViewport
    vv?.addEventListener("resize", schedule)
    vv?.addEventListener("scroll", schedule)
    window.addEventListener("orientationchange", schedule)
    window.addEventListener("resize", schedule)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      vv?.removeEventListener("resize", schedule)
      vv?.removeEventListener("scroll", schedule)
      window.removeEventListener("orientationchange", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])
}

function useFooterHeight(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = ref.current
    if (!el) return

    const update = () => {
      const styles = getComputedStyle(el)
      const paddingBottom = parseFloat(styles.paddingBottom || "0") || 0
      const raw = el.getBoundingClientRect().height
      const height = Math.max(0, raw - paddingBottom)
      document.documentElement.style.setProperty("--footer-h", `${height}px`)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("orientationchange", update)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("orientationchange", update)
      window.removeEventListener("resize", update)
    }
  }, [ref])
}

type ScrollLockMode = "overflow" | "fixed"

function useBodyScrollLock(mode: ScrollLockMode = "overflow") {
  useEffect(() => {
    if (typeof window === "undefined") return
    const body = document.body
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }

    if (mode === "fixed") {
      const scrollY = window.scrollY
      body.style.overflow = "hidden"
      body.style.position = "fixed"
      body.style.top = `-${scrollY}px`
      body.style.left = "0"
      body.style.right = "0"
      body.style.width = "100%"
      return () => {
        body.style.overflow = prev.overflow
        body.style.position = prev.position
        body.style.top = prev.top
        body.style.left = prev.left
        body.style.right = prev.right
        body.style.width = prev.width
        window.scrollTo(0, scrollY)
      }
    }

    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = prev.overflow
    }
  }, [mode])
}

export function ReelStage() {
  useStageViewport()

  // If background scroll leaks on some devices, switch to "fixed".
  useBodyScrollLock("overflow")

  const footerRef = useRef<HTMLElement | null>(null)
  useFooterHeight(footerRef)

  return (
    <div className="reel-stage">
      <div className="reel-video">
        <video className="reel-video__el" src="/sample.mp4" playsInline muted autoPlay loop />
      </div>

      <div className="reel-ui">
        <div className="reel-top">
          <button className="btn">{"<"}</button>
        </div>

        <div className="reel-right">
          <button className="btn">Like</button>
          <button className="btn">Comment</button>
        </div>

        <div className="reel-bottom">
          <button className="cta">Reserve now</button>
          <button className="cta">See more</button>
        </div>
      </div>

      <nav ref={footerRef} className="app-footer">
        {/* Footer nav */}
      </nav>
    </div>
  )
}
