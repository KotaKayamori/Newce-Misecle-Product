"use server"
import { getRestaurants, getRestaurantById } from "@/lib/database"

export async function searchRestaurants(formData: FormData) {
  const query = formData.get("query") as string
  const genre = formData.get("genre") as string
  const distance = formData.get("distance") as string
  const availableOnly = formData.get("availableOnly") === "true"
  const subscriptionDiscount = formData.get("subscriptionDiscount") === "true"

  try {
    const restaurants = await getRestaurants({
      genre: genre || undefined,
      distance: distance ? Number.parseFloat(distance) : undefined,
      availableOnly,
      subscriptionDiscount,
    })

    // Filter by search query if provided
    const filteredRestaurants = query
      ? restaurants.filter(
          (r) =>
            r.name.toLowerCase().includes(query.toLowerCase()) || r.genre.toLowerCase().includes(query.toLowerCase()),
        )
      : restaurants

    return { success: true, data: filteredRestaurants }
  } catch (error) {
    console.error("Search restaurants error:", error)
    return { success: false, error: "レストランの検索に失敗しました" }
  }
}

export async function getRestaurantDetails(restaurantId: number) {
  try {
    const restaurant = await getRestaurantById(restaurantId)
    return { success: true, data: restaurant }
  } catch (error) {
    console.error("Get restaurant details error:", error)
    return { success: false, error: "レストラン情報の取得に失敗しました" }
  }
}
