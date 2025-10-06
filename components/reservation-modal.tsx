"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { makeReservation } from "@/app/actions/reservation-actions"
import { useAuth } from "./auth-provider"

interface ReservationModalProps {
  restaurant: {
    id: number
    name: string
    image_url?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function ReservationModal({ restaurant, isOpen, onClose }: ReservationModalProps) {
  const { user } = useAuth()
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [people, setPeople] = useState(2)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("restaurantId", restaurant.id.toString())
      formData.append("date", date)
      formData.append("time", time)
      formData.append("people", people.toString())
      formData.append("status", "hold")

      const result = await makeReservation(formData)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      }
    } catch (error) {
      console.error("Reservation error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-green-600 mb-2">仮押さえ完了！</h3>
            <p className="text-gray-600">15分以内に確定してください</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>予約する</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">{restaurant.name}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="time">時間</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="people">人数</Label>
              <Input
                id="people"
                type="number"
                min="1"
                max="10"
                value={people}
                onChange={(e) => setPeople(Number(e.target.value))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "予約中..." : "仮押さえする（15分間）"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
