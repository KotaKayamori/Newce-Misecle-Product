import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserReservations } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "ログインが必要です" }, { status: 401 })
    }

    const reservations = await getUserReservations(user.id)
    return NextResponse.json({ success: true, data: reservations })
  } catch (error) {
    console.error("API reservations error:", error)
    return NextResponse.json({ success: false, error: "予約情報の取得に失敗しました" }, { status: 500 })
  }
}
