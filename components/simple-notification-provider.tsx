"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface Notification {
  id: number
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  time: string
  icon: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export function SimpleNotificationProvider({ children }: { children: React.ReactNode }) {
  // Mock notifications for development
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      type: "reservation",
      title: "予約確認のお知らせ",
      message: "寿司 銀座での予約が確定しました。1月20日 18:30〜",
      time: "2時間前",
      read: false,
      created_at: new Date().toISOString(),
      icon: null,
    },
    {
      id: 2,
      type: "promotion",
      title: "会員限定特典",
      message: "今週末限定！対象店舗で20%オフクーポンをプレゼント",
      time: "1日前",
      read: false,
      created_at: new Date().toISOString(),
      icon: null,
    },
  ])

  const markAsRead = (id: number) => {
    // Mock mark as read
    console.log("Mark as read:", id)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
