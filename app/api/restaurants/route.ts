import { type NextRequest, NextResponse } from "next/server"
import { getRestaurants } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const filters = {
    genre: searchParams.get("genre") || undefined,
    distance: searchParams.get("distance") ? Number.parseFloat(searchParams.get("distance")!) : undefined,
    availableOnly: searchParams.get("availableOnly") === "true",
    subscriptionDiscount: searchParams.get("subscriptionDiscount") === "true",
  }

  try {
    const restaurants = await getRestaurants(filters)
    return NextResponse.json({ success: true, data: restaurants })
  } catch (error) {
    console.error("API restaurants error:", error)
    return NextResponse.json({ success: false, error: "レストランの取得に失敗しました" }, { status: 500 })
  }
}
