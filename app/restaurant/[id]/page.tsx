"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Clock, Phone, Heart, Share2, ExternalLink, Percent, Users, Bookmark } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function RestaurantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [isFavorited, setIsFavorited] = useState(false)
  const [showReservationButton, setShowReservationButton] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedStatsTab, setSelectedStatsTab] = useState("followers")
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showPosts, setShowPosts] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [showStoreDetails, setShowStoreDetails] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (!showDetails) return // Only show button when details are visible

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Show button when user scrolls down more than 300px or near bottom
      if (scrollY > 300 || scrollY + windowHeight > documentHeight - 200) {
        setShowReservationButton(true)
      } else {
        setShowReservationButton(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [showDetails]) // Add showDetails as dependency

  // Add this useEffect to reset button state when details change
  useEffect(() => {
    if (!showDetails) {
      setShowReservationButton(false)
    }
  }, [showDetails])

  const menuItems = [
    {
      category: "焼き鳥",
      items: [
        { name: "もも", price: "¥180", description: "ジューシーな鶏もも肉" },
        { name: "つくね", price: "¥200", description: "自家製つくね、タレ・塩選択可" },
        { name: "ねぎま", price: "¥190", description: "鶏肉とねぎの絶妙な組み合わせ" },
        { name: "皮", price: "¥160", description: "パリパリの鶏皮" },
        { name: "レバー", price: "¥170", description: "新鮮なレバー" },
        { name: "ハツ", price: "¥180", description: "コリコリ食感のハツ" },
      ],
    },
    {
      category: "一品料理",
      items: [
        { name: "鶏の唐揚げ", price: "¥680", description: "外はカリッと中はジューシー" },
        { name: "親子丼", price: "¥850", description: "ふわとろ卵の親子丼" },
        { name: "鶏白湯ラーメン", price: "¥780", description: "濃厚鶏白湯スープ" },
        { name: "手羽先の塩焼き", price: "¥480", description: "シンプルな塩味で鶏の旨味を堪能" },
      ],
    },
    {
      category: "ドリンク",
      items: [
        { name: "生ビール", price: "¥480", description: "キンキンに冷えたビール" },
        { name: "ハイボール", price: "¥420", description: "爽やかなハイボール" },
        { name: "日本酒", price: "¥500", description: "厳選された日本酒" },
        { name: "焼酎", price: "¥450", description: "芋・麦から選択可" },
      ],
    },
  ]

  const coupons = [
    {
      id: 1,
      title: "焼き鳥5本セット500円引き",
      description: "人気の焼き鳥5本セットが500円引きでお楽しみいただけます",
      discount: "¥500OFF",
      validUntil: "2024年2月15日",
      minSpend: "¥2,000以上",
      available: true,
    },
    {
      id: 2,
      title: "ドリンク1杯無料",
      description: "焼き鳥注文でドリンク1杯サービス",
      discount: "1杯無料",
      validUntil: "2024年2月29日",
      minSpend: "¥1,500以上",
      available: true,
    },
  ]

  const reviews = [
    {
      id: 1,
      userName: "田中太郎",
      rating: 5,
      date: "2024年1月10日",
      comment: "焼き鳥が本当に美味しい！特につくねは絶品でした。店員さんも親切で、また来たいと思います。",
      helpful: 12,
    },
    {
      id: 2,
      userName: "佐藤花子",
      rating: 4,
      date: "2024年1月8日",
      comment: "雰囲気が良くて、デートにもおすすめです。焼き鳥の種類も豊富で満足でした。",
      helpful: 8,
    },
    {
      id: 3,
      userName: "山田次郎",
      rating: 5,
      date: "2024年1月5日",
      comment: "炭火で焼いた焼き鳥は香ばしくて最高！ビールとの相性も抜群です。",
      helpful: 15,
    },
    {
      id: 4,
      userName: "鈴木美咲",
      rating: 4,
      date: "2024年1月3日",
      comment: "友人と利用しました。料理は美味しかったですが、少し混雑していて待ち時間がありました。",
      helpful: 6,
    },
  ]

  const openGoogleMaps = () => {
    if (restaurant?.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, "_blank")
    }
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">レストランが見つかりませんでした</p>
          <Button onClick={() => router.back()}>戻る</Button>
        </div>
      </div>
    )
  }

  // Profile Page View
  if (showProfile) {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setShowProfile(false)} className="hover:bg-gray-100">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">プロフィール</h1>
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold text-2xl">
              {restaurant.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">@{restaurant.name.toLowerCase().replace(/\s+/g, "_")}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <button
                  onClick={() => {
                    setSelectedStatsTab("followers")
                    setShowFollowers(true)
                  }}
                  className={`text-center hover:bg-gray-50 p-2 rounded transition-colors relative ${
                    selectedStatsTab === "followers" ? "text-black" : "text-gray-600"
                  }`}
                >
                  <p className="font-semibold text-gray-800">1.2k</p>
                  <p className="text-gray-500">フォロワー</p>
                  {selectedStatsTab === "followers" && showFollowers && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedStatsTab("following")
                    setShowFollowing(true)
                  }}
                  className={`text-center hover:bg-gray-50 p-2 rounded transition-colors relative ${
                    selectedStatsTab === "following" ? "text-black" : "text-gray-600"
                  }`}
                >
                  <p className="font-semibold text-gray-800">234</p>
                  <p className="text-gray-500">フォロー中</p>
                  {selectedStatsTab === "following" && showFollowing && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedStatsTab("posts")
                    setShowPosts(true)
                  }}
                  className={`text-center hover:bg-gray-50 p-2 rounded transition-colors relative ${
                    selectedStatsTab === "posts" ? "text-black" : "text-gray-600"
                  }`}
                >
                  <p className="font-semibold text-gray-800">89</p>
                  <p className="text-gray-500">投稿</p>
                  {selectedStatsTab === "posts" && showPosts && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition">
            今すぐ予約する
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2 bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setShowDetails(!showDetails)}
          >
            もっと見る…
          </Button>
        </div>

        {/* Tabs */}
        {showDetails && (
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0 border-0">
              <TabsTrigger
                value="menu"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                メニュー
              </TabsTrigger>
              <TabsTrigger
                value="coupons"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                クーポン
              </TabsTrigger>
              <TabsTrigger
                value="access"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                アクセス
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600"
              >
                レビュー
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="mt-0">
              <div className="p-6 space-y-6">
                {menuItems.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">{category.category}</h3>
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          <span className="font-semibold text-orange-600 ml-4">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coupons" className="mt-0">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">利用可能なクーポン</h3>
                {coupons.map((coupon) => (
                  <Card key={coupon.id} className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{coupon.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 ml-3">
                          <Percent className="w-3 h-3 mr-1" />
                          {coupon.discount}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>最低注文: {coupon.minSpend}</span>
                        <span>有効期限: {coupon.validUntil}</span>
                      </div>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        disabled={!coupon.available}
                      >
                        {coupon.available ? "クーポンを取得" : "取得済み"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="access" className="mt-0">
              <div className="p-6 space-y-6">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Google Map</p>
                    <p className="text-sm text-gray-500">{restaurant.address}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-transparent"
                  onClick={openGoogleMaps}
                >
                  <ExternalLink className="w-4 h-4" />
                  ほかのアプリで位置を確認
                </Button>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">住所</p>
                      <p className="text-gray-600">{restaurant.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">電話番号</p>
                      <p className="text-gray-600">{restaurant.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">営業時間</p>
                      <p className="text-gray-600">{restaurant.hours}</p>
                      <p className="text-sm text-gray-500">定休日: {restaurant.closedDays}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <div className="p-6 space-y-6">
                <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Heart className="w-8 h-8 fill-pink-500 text-pink-500" />
                    <span className="text-3xl font-bold">{restaurant.rating}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(restaurant.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{restaurant.reviewCount || 128}件のレビュー</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">ユーザーレビュー</h3>
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{review.userName}</p>
                              <p className="text-xs text-gray-500">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                            <Users className="w-3 h-3 mr-1" />
                            参考になった ({review.helpful})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Short Videos Feed - Full Screen Vertical Scroll */}
      <div className="h-screen overflow-y-auto snap-y snap-mandatory">
        {/* Main restaurant video */}
        <div className="h-screen w-full relative snap-start">
          {/* Video Background */}
          <video
            src={restaurant.video_url || "/placeholder-video.mp4"}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
            playsInline
          />

          {/* Overlay Content */}
          <div className="absolute inset-0 flex">
            {/* Left side - Video info */}
            <div className="flex-1 flex flex-col justify-end p-4 pb-32">
              <div className="text-white">
                {/* Restaurant Profile */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {restaurant.name.charAt(0)}
                    </div>
                    <span className="text-white font-semibold">
                      @{restaurant.name.toLowerCase().replace(/\s+/g, "_")}
                    </span>
                  </button>
                </div>

                <h2 className="text-lg font-bold mb-2">
                  {restaurant.name}のおいしい
                  {restaurant.genre === "フレンチ"
                    ? "フレンチトースト"
                    : restaurant.genre === "和食"
                      ? "寿司"
                      : restaurant.genre === "イタリアン"
                        ? "パスタ"
                        : restaurant.genre === "焼肉"
                          ? "焼肉"
                          : "料理"}
                </h2>

                <p className="text-sm mb-3 opacity-90">
                  {restaurant.description || "本格的な料理を気軽に楽しめるお店です！"}
                </p>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(restaurant.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white opacity-50"
                        }`}
                      />
                    ))}
                    <span className="ml-1">{restaurant.rating}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.distance}km</span>
                  </div>

                  <span>{restaurant.price_range}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReservationForm(true)
                    }}
                  >
                    今すぐ予約する
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowStoreDetails(true)
                    }}
                  >
                    もっと見る…
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="w-16 flex flex-col items-center justify-end pb-20 gap-6">
              {/* Like button */}
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
                <span className="text-white text-xs font-medium drop-shadow-lg mt-1">128</span>
              </div>

              {/* Save/Bookmark button */}
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 flex items-center justify-center">
                  <Bookmark className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
              </div>

              {/* Share button */}
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Header buttons overlay */}
          <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white font-bold text-lg"
            >
              ＜
            </Button>
          </div>
        </div>

        {/* Additional related videos */}
        {[
          {
            id: 2,
            title: `${restaurant.name}の特製デザート`,
            description: "人気のデザートメニューをご紹介！甘さ控えめで上品な味わいです。",
            likes: 890,
            comments: 67,
          },
          {
            id: 3,
            title: `${restaurant.name}のランチメニュー`,
            description: "お得なランチセットが大人気！平日限定の特別メニューもあります。",
            likes: 1240,
            comments: 89,
          },
          {
            id: 4,
            title: `${restaurant.name}の店内の様子`,
            description: "落ち着いた雰囲気の店内をご紹介。デートや接待にもおすすめです。",
            likes: 567,
            comments: 34,
          },
        ].map((video) => (
          <div key={video.id} className="h-screen w-full relative snap-start">
            {/* Video Background */}
            <video
              src={restaurant.video_url || "/placeholder-video.mp4"}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 flex">
              {/* Left side - Video info */}
              <div className="flex-1 flex flex-col justify-end p-4 pb-32">
                <div className="text-white">
                  {/* Restaurant Profile */}
                  <div className="mb-3">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                        {restaurant.name.charAt(0)}
                      </div>
                      <span className="text-white font-semibold">
                        @{restaurant.name.toLowerCase().replace(/\s+/g, "_")}
                      </span>
                    </button>
                  </div>

                  <h2 className="text-lg font-bold mb-2">{video.title}</h2>
                  <p className="text-sm mb-3 opacity-90">{video.description}</p>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(restaurant.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-white opacity-50"
                          }`}
                        />
                      ))}
                      <span className="ml-1">{restaurant.rating}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{restaurant.distance}km</span>
                    </div>

                    <span>{restaurant.price_range}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowReservationForm(true)
                      }}
                    >
                      今すぐ予約する
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-full font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowStoreDetails(true)
                      }}
                    >
                      もっと見る…
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right side - Action buttons */}
              <div className="w-16 flex flex-col items-center justify-end pb-20 gap-6">
                {/* Like button */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                  <span className="text-white text-xs font-medium drop-shadow-lg mt-1">
                    {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}k` : video.likes}
                  </span>
                </div>

                {/* Save/Bookmark button */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                </div>

                {/* Share button */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b sticky top-0 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReservationForm(false)}
                className="hover:bg-gray-100"
              >
                ＜
              </Button>
              <h1 className="text-xl font-semibold">お店を予約する</h1>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                {/* お名前 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="山田太郎"
                  />
                </div>

                {/* 人数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">人数</label>
                  <select className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}名
                      </option>
                    ))}
                  </select>
                </div>

                {/* 日付 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                  <input
                    type="date"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* 時間帯 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">時間帯</label>
                  <select className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="11:00">11:00</option>
                    <option value="11:30">11:30</option>
                    <option value="12:00">12:00</option>
                    <option value="12:30">12:30</option>
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                    <option value="17:00">17:00</option>
                    <option value="17:30">17:30</option>
                    <option value="18:00">18:00</option>
                    <option value="18:30">18:30</option>
                    <option value="19:00">19:00</option>
                    <option value="19:30">19:30</option>
                    <option value="20:00">20:00</option>
                    <option value="20:30">20:30</option>
                    <option value="21:00">21:00</option>
                  </select>
                </div>

                {/* 席タイプ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">席タイプ</label>
                  <select className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="table">テーブル席</option>
                    <option value="counter">カウンター席</option>
                    <option value="private">個室</option>
                    <option value="terrace">テラス席</option>
                    <option value="booth">ボックス席</option>
                    <option value="any">席タイプ指定なし</option>
                  </select>
                </div>

                {/* メッセージ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メッセージ（任意）</label>
                  <textarea
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    placeholder="例：誕生日のバースデーケーキをお願いします"
                  />
                </div>

                {/* 送信ボタン */}
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg">
                  予約リクエストを送信
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Store Details Modal */}
      {showStoreDetails && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="px-6 py-4 flex items-center gap-4 border-b">
            <Button variant="ghost" size="sm" onClick={() => setShowStoreDetails(false)} className="hover:bg-gray-100">
              ＜
            </Button>
            <h1 className="text-xl font-semibold">店舗詳細</h1>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{restaurant.name}</h2>
              </div>

              {/* Store Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">店舗情報</h3>
                <p className="text-gray-600">{restaurant.description || "本格的な料理を気軽に楽しめるお店です。"}</p>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">住所</h3>
                <p className="text-gray-600">{restaurant.address}</p>
              </div>

              {/* Phone Number */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">電話番号</h3>
                <p className="text-gray-600">{restaurant.phone}</p>
              </div>

              {/* Business Hours */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">営業時間</h3>
                <p className="text-gray-600">{restaurant.hours}</p>
                <p className="text-sm text-gray-500">定休日: {restaurant.closedDays}</p>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">決済方法</h3>
                <p className="text-gray-600">現金、クレジットカード、電子マネー、QRコード決済</p>
              </div>

              {/* Access */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">アクセス</h3>
                <p className="text-gray-600">最寄り駅から徒歩3分</p>
              </div>

              {/* Influencer Review */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">紹介したインフルエンサーの感想</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    今回は、コスパ最強の回らない寿司ランチ紹介！
                    <br />
                    <br />
                    ここは1995年から続く、老舗のお寿司さんで、29年間も愛され続けている
                    <br />
                    <br />
                    ここはランチでお得にお寿司をいただけて、握りは１人前で880円。1.５人前では、1320円でいただけて超お得。
                    <br />
                    <br />
                    目の前で握ってくれる大将はとても気さくで何度も通いたくなる魅力溢れるお店だった！
                    <br />
                    <br />
                    気になった方はぜひ予約してみてね〜！
                  </p>
                </div>
              </div>

              {/* Reservation Button */}
              <div className="pt-4">
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg"
                  onClick={() => {
                    setShowStoreDetails(false)
                    setShowReservationForm(true)
                  }}
                >
                  この店舗を予約する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
