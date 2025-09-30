"use server"

import { getCurrentUser } from "@/lib/auth"
import { createReservation, updateReservationStatus, getUserReservations, createNotification } from "@/lib/database"
import { revalidatePath } from "next/cache"

export async function makeReservation(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const restaurantId = Number.parseInt(formData.get("restaurantId") as string)
  const date = formData.get("date") as string
  const time = formData.get("time") as string
  const people = Number.parseInt(formData.get("people") as string)
  const status = (formData.get("status") as "hold" | "confirmed") || "hold"

  try {
    const reservation = await createReservation({
      user_id: user.id,
      restaurant_id: restaurantId,
      date,
      time,
      people,
      status,
    })

    // Create notification
    await createNotification({
      user_id: user.id,
      type: "reservation",
      title: status === "hold" ? "仮押さえ完了" : "予約確定",
      message: `${date} ${time}の予約が${status === "hold" ? "仮押さえ" : "確定"}されました`,
    })

    revalidatePath("/reservations")
    return { success: true, data: reservation }
  } catch (error) {
    console.error("Make reservation error:", error)
    return { success: false, error: "予約の作成に失敗しました" }
  }
}

export async function confirmReservation(reservationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const reservation = await updateReservationStatus(reservationId, "confirmed")

    // Create notification
    await createNotification({
      user_id: user.id,
      type: "reservation",
      title: "予約確定",
      message: "仮押さえが予約確定されました",
    })

    revalidatePath("/reservations")
    return { success: true, data: reservation }
  } catch (error) {
    console.error("Confirm reservation error:", error)
    return { success: false, error: "予約の確定に失敗しました" }
  }
}

export async function cancelReservation(reservationId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const reservation = await updateReservationStatus(reservationId, "cancelled")

    // Create notification
    await createNotification({
      user_id: user.id,
      type: "reservation",
      title: "予約キャンセル",
      message: "予約がキャンセルされました",
    })

    revalidatePath("/reservations")
    return { success: true, data: reservation }
  } catch (error) {
    console.error("Cancel reservation error:", error)
    return { success: false, error: "予約のキャンセルに失敗しました" }
  }
}

export async function getMyReservations() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  try {
    const reservations = await getUserReservations(user.id)
    return { success: true, data: reservations }
  } catch (error) {
    console.error("Get reservations error:", error)
    return { success: false, error: "予約情報の取得に失敗しました" }
  }
}
