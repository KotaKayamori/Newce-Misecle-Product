"use client"

import { useEffect, useMemo, useState } from "react"

import { supabase } from "@/lib/supabase"

interface PhoneDialCardProps {
  open: boolean
  restaurantId: string | number | null
  fallbackTel?: string | null
  onClose: () => void
}

export function PhoneDialCard({ open, restaurantId, fallbackTel, onClose }: PhoneDialCardProps) {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")

  useEffect(() => {
    if (!open) {
      setPhoneNumber(null)
      setStatus("idle")
      return
    }

    const normalizedFallback = normalizeTel(fallbackTel)
    if (normalizedFallback) {
      setPhoneNumber(normalizedFallback)
      setStatus("idle")
      return
    }

    if (!restaurantId) {
      setPhoneNumber(null)
      setStatus("error")
      return
    }

    const isNumericId = typeof restaurantId === "number" || (typeof restaurantId === "string" && /^[0-9]+$/.test(restaurantId))
    const videoId = !isNumericId && typeof restaurantId === "string" ? restaurantId : null
    const numericId = isNumericId ? Number(restaurantId) : null

    let aborted = false
    const fetchTel = async () => {
      setStatus("loading")
      try {
        if (numericId !== null) {
          const { data, error } = await supabase
            .from("restaurants")
            .select("tel")
            .eq("id", numericId)
            .maybeSingle()
          if (!aborted) {
            if (!error && data) {
              setPhoneNumber(normalizeTel((data as { tel?: string | null })?.tel))
              setStatus("idle")
            } else {
              setPhoneNumber(null)
              setStatus("error")
            }
          }
        } else if (videoId) {
          const { data, error } = await supabase
            .from("videos")
            .select("tel")
            .eq("id", videoId)
            .maybeSingle()
          if (!aborted) {
            if (!error && data) {
              setPhoneNumber(normalizeTel((data as { tel?: string | null })?.tel))
              setStatus("idle")
            } else {
              setPhoneNumber(null)
              setStatus("error")
            }
          }
        } else {
          if (!aborted) {
            setPhoneNumber(null)
            setStatus("error")
          }
        }
      } catch {
        if (!aborted) {
          setPhoneNumber(null)
          setStatus("error")
        }
      }
    }

    fetchTel()
    return () => {
      aborted = true
    }
  }, [open, restaurantId, fallbackTel])

  const sanitized = useMemo(() => (phoneNumber ? phoneNumber.replace(/[^0-9+]/g, "") : null), [phoneNumber])

  if (!open) return null

  const handleCall = () => {
    if (!sanitized) return
    window.location.href = `tel:${sanitized}`
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[260px] rounded-[28px] bg-[#2F2E30] bg-opacity-90 p-3 text-center shadow-2xl space-y-2">
        <button
          type="button"
          className="w-full rounded-[22px] bg-[#24A3FF] py-3 text-base font-semibold text-white shadow transition hover:bg-[#1f8ede] disabled:opacity-60"
          onClick={handleCall}
          disabled={!sanitized || status === "loading"}
        >
          {status === "loading" && "電話番号を取得中..."}
          {status !== "loading" && sanitized && `${phoneNumber}に発信`}
          {status !== "loading" && !sanitized && "電話番号が見つかりません"}
        </button>
        <button
          type="button"
          className="w-full rounded-[22px] bg-[#504f52] py-3 text-base font-semibold text-white/90 hover:bg-[#5c5b5f]"
          onClick={onClose}
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

function normalizeTel(input?: string | null): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : null
}
