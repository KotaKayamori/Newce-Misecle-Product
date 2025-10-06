"use client"
import Navigation from "@/components/navigation"

import { Heart, Send, Bookmark, Star, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function BookmarksPage() {
  const router = useRouter()
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [reservationData, setReservationData] = useState({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  // Video URLs array
  const videoUrls = [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e4922433bbfa40c89df0a9e1f75192fd-WalYMXOSoRpEM4dikM8ZHQC2pIv6cw.MP4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01128128b91e4216be8e0f1e2eb76d3a-83Mcy3H53RYQLcX9JxsyxoLI9VHH8M.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efc4143cd14b4daabbf86c724c2d911a-TuRbYoAW7DVdz2WGrlJIZXTGk5Tj8K.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecf421d1612b4e9c9d9d18982d9e29c1-PhpTeES7tlpnyhvlVCNGF3WY1AWCBs.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/94ed3b99e81b4f4e861e98fa6a737a05-KCDhmH7BRPUUFsJ3n6bACbv40LgLUA.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0b918043eadc42dbb8a11a8666292e14-MOl0JytZ8z9foz7rwhuYZDR1iWJgOf.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f0ef4e73b2634edc83f0662216afea99-9Wmgb9IlxC1XmLjSFQQ52IbA6PSi7X.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/59c69364867548408e26dc2ce530028f-rsrZkbHGsDOVbLiC9Jk0bYXklUHcNN.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6633e00c4e854a1e9ad7715144d0d4a0-CbfjiPi1ex3Z6G7WqIVv7uNBDVqmqF.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8711c29b4db94231af27d2ec9fac2504-1ivyBR2r1ugGBqyMd4fosbGMRt20gl.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9e218dd5bf174e77a48386174af1272d-2L3LydtHICbzoyeqvMCuFsfe8WXdYw.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/8e32fd32a40a4257ad509cfb7a5e7685-PClZMaKQ83B8PTSGT2Xkn5qmEAHZ7W.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cf02561daa5b4af8863d9591ac62645e-CE6tYTu63CWHCCajVlHyYxANJzT4aP.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fb92522435974a5da420115eda3f8a0b-Ug5LtXi1jgInPaP8WqJ2usgrSf5L8a.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6a98071d2ad1460084381913878425ad-c9sgTJjw5Lkvk8kYad58Mks6fi1aPy.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/031fc99b3cb649158886f54bba3bd53b-cHFVNW41aIRIDbU37YiciolgCGxrR9.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/029b03bc9e78498a90e554d11522358c-DzJm5Gxy6PCwoSraWl6M5QbdeaTTFC.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b3b96c6e9aaf4fa4860c5ce5344b8dc3-H21RCMbelIgUirYbPxolPH16qfcz7W.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/efc4143cd14b4daabbf86c724c2d911a-IrBeGhEYIEDl7DoPhAnZp45y4voOq4.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01128128b91e4216be8e0f1e2eb76d3a-BJ2LcWGKStXMDp320r6s3jIC9p9366.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/e4922433bbfa40c89df0a9e1f75192fd-d17VTvBTfoFxaaqqdH3jOo8qYiChp9.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/94ed3b99e81b4f4e861e98fa6a737a05-CR47nL9G7ql7Z4P96PYNDn4NBydZy8.mp4",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecf421d1612b4e9c9d9d18982d9e29c1-bTJ7JdUlEt3Cc4F4Ig9Wl63nGr5qFw.mp4",
  ]

  // Instagram連携を想定したショート動画データ
  const instagramVideos = [
    {
      id: 1,
      restaurantId: 7,
      restaurantName: "炭火焼き鳥 とり源",
      restaurantEmail: "info@tori-gen.com",
      videoUrl: videoUrls[0],
      instagramPostId: "CXXXXXXXXXx",
      title: "炭火焼き鳥 とり源のおいしい焼肉",
      description: "炭火で丁寧に焼き上げる絶品焼き鳥！秘伝のタレが決め手です。 #焼き鳥 #炭火 #グルメ",
      likes: 1240,
      comments: 89,
      shares: 45,
      user: {
        name: "@tori_gen_official",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "tori_gen_official",
        isVerified: true,
      },
      genre: "焼肉",
      distance: "0.3km",
      rating: 4.6,
      location: "東京都渋谷区",
      hashtags: ["#焼き鳥", "#炭火", "#グルメ", "#渋谷", "#居酒屋"],
      postedAt: "2024年1月15日",
    },
    {
      id: 2,
      restaurantId: 10,
      restaurantName: "寿司処 海鮮",
      restaurantEmail: "reservation@kaisen-sushi.com",
      videoUrl: videoUrls[1],
      instagramPostId: "CYYYYYYYYYy",
      title: "寿司処 海鮮のおいしい寿司",
      description: "新鮮なネタと熟練の技で握る本格江戸前寿司をご覧ください。 #寿司 #江戸前 #新鮮",
      likes: 2150,
      comments: 156,
      shares: 78,
      user: {
        name: "@kaisenmaster",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "kaisenmaster",
        isVerified: true,
      },
      genre: "和食",
      distance: "0.6km",
      rating: 4.8,
      location: "東京都中央区",
      hashtags: ["#寿司", "#江戸前", "#新鮮", "#銀座", "#和食"],
      postedAt: "2024年1月12日",
    },
    {
      id: 3,
      restaurantId: 15,
      restaurantName: "イタリアン Trattoria Sole",
      restaurantEmail: "contact@trattoria-sole.jp",
      videoUrl: videoUrls[2],
      instagramPostId: "CZZZZZZZZZz",
      title: "イタリアン Trattoria Soleのおいしいパスタ",
      description: "イタリア直輸入の小麦粉で作る手打ちパスタの製作過程をお見せします。 #パスタ #イタリアン #手打ち",
      likes: 890,
      comments: 67,
      shares: 34,
      user: {
        name: "@chef_mario",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "chef_mario",
        isVerified: false,
      },
      genre: "イタリアン",
      distance: "0.4km",
      rating: 4.3,
      location: "東京都新宿区",
      hashtags: ["#パスタ", "#イタリアン", "#手打ち", "#新宿", "#本格"],
      postedAt: "2024年1月10日",
    },
    {
      id: 4,
      restaurantId: 13,
      restaurantName: "天ぷら 江戸前",
      restaurantEmail: "info@tempura-edomae.co.jp",
      videoUrl: videoUrls[3],
      instagramPostId: "CAAAAAAAAAA",
      title: "天ぷら 江戸前のおいしい料理",
      description: "温度管理と衣の作り方が決め手！プロの天ぷら技術を公開。 #天ぷら #和食 #職人技",
      likes: 1560,
      comments: 123,
      shares: 67,
      user: {
        name: "@tempura_shokunin",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "tempura_shokunin",
        isVerified: true,
      },
      genre: "和食",
      distance: "0.7km",
      rating: 4.5,
      location: "東京都千代田区",
      hashtags: ["#天ぷら", "#和食", "#職人技", "#丸の内", "#高級"],
      postedAt: "2024年1月8日",
    },
    {
      id: 5,
      restaurantId: 19,
      restaurantName: "中華料理 北京飯店",
      restaurantEmail: "yoyaku@beijing-hanten.com",
      videoUrl: videoUrls[4],
      instagramPostId: "CBBBBBBBBBB",
      title: "中華料理 北京飯店のおいしい料理",
      description: "パラパラチャーハンの秘訣は火力と手際の良さ！プロの技をご覧ください。 #中華 #チャーハン #本格",
      likes: 980,
      comments: 78,
      shares: 23,
      user: {
        name: "@beijing_hanten",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "beijing_hanten",
        isVerified: false,
      },
      genre: "中華",
      distance: "0.8km",
      rating: 4.4,
      location: "東京都港区",
      hashtags: ["#中華", "#チャーハン", "#本格", "#六本木", "#老舗"],
      postedAt: "2024年1月5日",
    },
    {
      id: 6,
      restaurantId: 21,
      restaurantName: "フレンチビストロ Le Jardin",
      restaurantEmail: "contact@lejardin.jp",
      videoUrl: videoUrls[5],
      instagramPostId: "CCCCCCCCCCC",
      title: "フレンチビストロ Le Jardinのおいしいフレンチ",
      description: "本格フレンチをカジュアルに楽しめるビストロスタイル。 #フレンチ #ビストロ #カジュアル",
      likes: 1320,
      comments: 95,
      shares: 41,
      user: {
        name: "@lejardin_chef",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "lejardin_chef",
        isVerified: true,
      },
      genre: "フレンチ",
      distance: "0.9km",
      rating: 4.7,
      location: "東京都港区",
      hashtags: ["#フレンチ", "#ビストロ", "#カジュアル", "#赤坂", "#本格"],
      postedAt: "2024年1月3日",
    },
    {
      id: 7,
      restaurantId: 23,
      restaurantName: "韓国料理 Seoul Kitchen",
      restaurantEmail: "info@seoul-kitchen.jp",
      videoUrl: videoUrls[6],
      instagramPostId: "CDDDDDDDDDD",
      title: "韓国料理 Seoul Kitchenのおいしい韓国料理",
      description: "本場韓国の味を再現した絶品料理の数々をお楽しみください。 #韓国料理 #本場 #辛い",
      likes: 1150,
      comments: 87,
      shares: 29,
      user: {
        name: "@seoul_kitchen",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "seoul_kitchen",
        isVerified: false,
      },
      genre: "韓国料理",
      distance: "1.1km",
      rating: 4.4,
      location: "東京都新宿区",
      hashtags: ["#韓国料理", "#本場", "#辛い", "#新大久保", "#チーズ"],
      postedAt: "2024年1月1日",
    },
    {
      id: 8,
      restaurantId: 25,
      restaurantName: "タイ料理 Bangkok Express",
      restaurantEmail: "reservation@bangkok-express.jp",
      videoUrl: videoUrls[7],
      instagramPostId: "CEEEEEEEEE",
      title: "タイ料理 Bangkok Expressのおいしいタイ料理",
      description: "スパイシーで香り豊かなタイ料理をお楽しみください。 #タイ料理 #スパイシー #香辛料",
      likes: 890,
      comments: 64,
      shares: 18,
      user: {
        name: "@bangkok_express",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "bangkok_express",
        isVerified: false,
      },
      genre: "タイ料理",
      distance: "1.3km",
      rating: 4.2,
      location: "東京都渋谷区",
      hashtags: ["#タイ料理", "#スパイシー", "#香辛料", "#原宿", "#エスニック"],
      postedAt: "2023年12月30日",
    },
    {
      id: 9,
      restaurantId: 27,
      restaurantName: "カフェ Sunny Side",
      restaurantEmail: "info@sunnyside-cafe.jp",
      videoUrl: videoUrls[8],
      instagramPostId: "CFFFFFFFFFF",
      title: "カフェ Sunny Sideのおいしいコーヒー",
      description: "厳選された豆で淹れる本格コーヒーとスイーツをお楽しみください。 #カフェ #コーヒー #スイーツ",
      likes: 750,
      comments: 42,
      shares: 15,
      user: {
        name: "@sunnyside_cafe",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "sunnyside_cafe",
        isVerified: false,
      },
      genre: "カフェ",
      distance: "0.5km",
      rating: 4.1,
      location: "東京都渋谷区",
      hashtags: ["#カフェ", "#コーヒー", "#スイーツ", "#表参道", "#リラックス"],
      postedAt: "2023年12月28日",
    },
    {
      id: 10,
      restaurantId: 29,
      restaurantName: "ステーキハウス Prime Cut",
      restaurantEmail: "reservation@primecut.jp",
      videoUrl: videoUrls[9],
      instagramPostId: "CGGGGGGGGG",
      title: "ステーキハウス Prime Cutのおいしいステーキ",
      description: "最高級の和牛を使用した絶品ステーキをご堪能ください。 #ステーキ #和牛 #高級",
      likes: 1680,
      comments: 134,
      shares: 52,
      user: {
        name: "@primecut_steak",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "primecut_steak",
        isVerified: true,
      },
      genre: "ステーキ",
      distance: "1.5km",
      rating: 4.8,
      location: "東京都港区",
      hashtags: ["#ステーキ", "#和牛", "#高級", "#六本木", "#記念日"],
      postedAt: "2023年12月25日",
    },
    {
      id: 11,
      restaurantId: 31,
      restaurantName: "ラーメン 麺屋 龍",
      restaurantEmail: "info@menya-ryu.jp",
      videoUrl: videoUrls[10],
      instagramPostId: "CHHHHHHHH",
      title: "ラーメン 麺屋 龍のおいしいラーメン",
      description: "濃厚な豚骨スープと自家製麺の絶妙なハーモニーをお楽しみください。 #ラーメン #豚骨 #自家製麺",
      likes: 1420,
      comments: 98,
      shares: 37,
      user: {
        name: "@menya_ryu",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "menya_ryu",
        isVerified: false,
      },
      genre: "ラーメン",
      distance: "0.7km",
      rating: 4.5,
      location: "東京都新宿区",
      hashtags: ["#ラーメン", "#豚骨", "#自家製麺", "#新宿", "#深夜営業"],
      postedAt: "2023年12月22日",
    },
    {
      id: 12,
      restaurantId: 33,
      restaurantName: "居酒屋 海の幸",
      restaurantEmail: "info@umi-no-sachi.jp",
      videoUrl: videoUrls[11],
      instagramPostId: "CIIIIIIIIII",
      title: "居酒屋 海の幸のおいしい海鮮料理",
      description: "新鮮な海の幸を使った絶品料理の数々をお楽しみください。 #居酒屋 #海鮮 #新鮮",
      likes: 1280,
      comments: 92,
      shares: 41,
      user: {
        name: "@umi_no_sachi",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "umi_no_sachi",
        isVerified: false,
      },
      genre: "居酒屋",
      distance: "0.9km",
      rating: 4.3,
      location: "東京都港区",
      hashtags: ["#居酒屋", "#海鮮", "#新鮮", "#築地", "#日本酒"],
      postedAt: "2023年12月20日",
    },
    {
      id: 13,
      restaurantId: 35,
      restaurantName: "洋食レストラン グリル王",
      restaurantEmail: "reservation@grill-king.jp",
      videoUrl: videoUrls[12],
      instagramPostId: "CJJJJJJJJJJ",
      title: "洋食レストラン グリル王のおいしい洋食",
      description: "昔ながらの洋食を現代風にアレンジした絶品料理をご堪能ください。 #洋食 #グリル #老舗",
      likes: 950,
      comments: 73,
      shares: 28,
      user: {
        name: "@grill_king",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "grill_king",
        isVerified: true,
      },
      genre: "洋食",
      distance: "1.2km",
      rating: 4.4,
      location: "東京都中央区",
      hashtags: ["#洋食", "#グリル", "#老舗", "#銀座", "#ハンバーグ"],
      postedAt: "2023年12月18日",
    },
    {
      id: 14,
      restaurantId: 37,
      restaurantName: "蕎麦処 山田屋",
      restaurantEmail: "info@yamadaya-soba.jp",
      videoUrl: videoUrls[13],
      instagramPostId: "CKKKKKKKKKK",
      title: "蕎麦処 山田屋のおいしい蕎麦",
      description: "手打ちそばと天ぷらの絶妙な組み合わせをお楽しみください。 #蕎麦 #手打ち #天ぷら",
      likes: 1150,
      comments: 85,
      shares: 33,
      user: {
        name: "@yamadaya_soba",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "yamadaya_soba",
        isVerified: false,
      },
      genre: "和食",
      distance: "0.8km",
      rating: 4.6,
      location: "東京都千代田区",
      hashtags: ["#蕎麦", "#手打ち", "#天ぷら", "#神田", "#老舗"],
      postedAt: "2023年12月15日",
    },
    {
      id: 15,
      restaurantId: 39,
      restaurantName: "スペイン料理 バルセロナ",
      restaurantEmail: "hola@barcelona-tokyo.jp",
      videoUrl: videoUrls[14],
      instagramPostId: "CLLLLLLLLL",
      title: "スペイン料理 バルセロナのおいしいスペイン料理",
      description: "本場スペインの味を東京で！パエリアとタパスをお楽しみください。 #スペイン料理 #パエリア #タパス",
      likes: 1380,
      comments: 104,
      shares: 47,
      user: {
        name: "@barcelona_tokyo",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "barcelona_tokyo",
        isVerified: true,
      },
      genre: "スペイン料理",
      distance: "1.4km",
      rating: 4.5,
      location: "東京都渋谷区",
      hashtags: ["#スペイン料理", "#パエリア", "#タパス", "#恵比寿", "#ワイン"],
      postedAt: "2023年12月12日",
    },
    {
      id: 16,
      restaurantId: 41,
      restaurantName: "インド料理 ガンジス",
      restaurantEmail: "namaste@ganges-curry.jp",
      videoUrl: videoUrls[15],
      instagramPostId: "CMMMMMMMMMM",
      title: "インド料理 ガンジスのおいしいカレー",
      description: "本場インドのスパイスを使った絶品カレーをお楽しみください。 #インド料理 #カレー #スパイス",
      likes: 1620,
      comments: 118,
      shares: 54,
      user: {
        name: "@ganges_curry",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "ganges_curry",
        isVerified: false,
      },
      genre: "インド料理",
      distance: "1.6km",
      rating: 4.4,
      location: "東京都新宿区",
      hashtags: ["#インド料理", "#カレー", "#スパイス", "#西新宿", "#ナン"],
      postedAt: "2023年12月10日",
    },
    {
      id: 17,
      restaurantId: 43,
      restaurantName: "お好み焼き 大阪屋",
      restaurantEmail: "info@osakaya-okonomiyaki.jp",
      videoUrl: videoUrls[16],
      instagramPostId: "CNNNNNNNNN",
      title: "お好み焼き 大阪屋のおいしいお好み焼き",
      description:
        "関西風お好み焼きと焼きそばの絶妙なコンビネーションをお楽しみください。 #お好み焼き #関西風 #焼きそば",
      likes: 980,
      comments: 76,
      shares: 31,
      user: {
        name: "@osakaya_okonomiyaki",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "osakaya_okonomiyaki",
        isVerified: false,
      },
      genre: "お好み焼き",
      distance: "1.0km",
      rating: 4.2,
      location: "東京都渋谷区",
      hashtags: ["#お好み焼き", "#関西風", "#焼きそば", "#道玄坂", "#ソース"],
      postedAt: "2023年12月8日",
    },
    {
      id: 18,
      restaurantId: 45,
      restaurantName: "回転寿司 まぐろ王",
      restaurantEmail: "info@maguro-king.jp",
      videoUrl: videoUrls[17],
      instagramPostId: "COOOOOOOOOO",
      title: "回転寿司 まぐろ王のおいしい寿司",
      description: "新鮮なまぐろと豊富なネタが自慢の回転寿司をお楽しみください。 #回転寿司 #まぐろ #新鮮",
      likes: 1450,
      comments: 102,
      shares: 43,
      user: {
        name: "@maguro_king",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "maguro_king",
        isVerified: true,
      },
      genre: "寿司",
      distance: "0.6km",
      rating: 4.3,
      location: "東京都港区",
      hashtags: ["#回転寿司", "#まぐろ", "#新鮮", "#品川", "#コスパ"],
      postedAt: "2023年12月5日",
    },
    {
      id: 19,
      restaurantId: 47,
      restaurantName: "焼肉 牛角",
      restaurantEmail: "info@gyukaku-yakiniku.jp",
      videoUrl: videoUrls[18],
      instagramPostId: "CPPPPPPPPPP",
      title: "焼肉 牛角のおいしい焼肉",
      description: "上質な和牛を使った絶品焼肉をお楽しみください。 #焼肉 #和牛 #BBQ",
      likes: 1890,
      comments: 145,
      shares: 62,
      user: {
        name: "@gyukaku_yakiniku",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "gyukaku_yakiniku",
        isVerified: true,
      },
      genre: "焼肉",
      distance: "0.4km",
      rating: 4.6,
      location: "東京都渋谷区",
      hashtags: ["#焼肉", "#和牛", "#BBQ", "#渋谷", "#肉"],
      postedAt: "2023年12月3日",
    },
    {
      id: 20,
      restaurantId: 49,
      restaurantName: "うどん 讃岐屋",
      restaurantEmail: "info@sanukiya-udon.jp",
      videoUrl: videoUrls[19],
      instagramPostId: "CQQQQQQQQQ",
      title: "うどん 讃岐屋のおいしいうどん",
      description: "本場讃岐うどんの手打ち麺とコシの強さをお楽しみください。 #うどん #讃岐 #手打ち",
      likes: 1240,
      comments: 89,
      shares: 35,
      user: {
        name: "@sanukiya_udon",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "sanukiya_udon",
        isVerified: false,
      },
      genre: "うどん",
      distance: "0.7km",
      rating: 4.4,
      location: "東京都新宿区",
      hashtags: ["#うどん", "#讃岐", "#手打ち", "#新宿", "#コシ"],
      postedAt: "2023年12月1日",
    },
    {
      id: 21,
      restaurantId: 51,
      restaurantName: "ピザ ナポリ",
      restaurantEmail: "ciao@pizza-napoli.jp",
      videoUrl: videoUrls[20],
      instagramPostId: "CRRRRRRRRRR",
      title: "ピザ ナポリのおいしいピザ",
      description: "本場ナポリ風の薄生地ピザを石窯で焼き上げます。 #ピザ #ナポリ #石窯",
      likes: 1560,
      comments: 112,
      shares: 48,
      user: {
        name: "@pizza_napoli",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "pizza_napoli",
        isVerified: true,
      },
      genre: "イタリアン",
      distance: "0.9km",
      rating: 4.5,
      location: "東京都港区",
      hashtags: ["#ピザ", "#ナポリ", "#石窯", "#青山", "#チーズ"],
      postedAt: "2023年11月28日",
    },
    {
      id: 22,
      restaurantId: 53,
      restaurantName: "メキシコ料理 カンティーナ",
      restaurantEmail: "hola@cantina-mexico.jp",
      videoUrl: videoUrls[21],
      instagramPostId: "CSSSSSSSSS",
      title: "メキシコ料理 カンティーナのおいしいタコス",
      description:
        "本場メキシコの味を再現したスパイシーなタコスとマルガリータをお楽しみください。 #メキシコ料理 #タコス #スパイシー",
      likes: 1340,
      comments: 97,
      shares: 38,
      user: {
        name: "@cantina_mexico",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "cantina_mexico",
        isVerified: false,
      },
      genre: "メキシコ料理",
      distance: "1.1km",
      rating: 4.3,
      location: "東京都渋谷区",
      hashtags: ["#メキシコ料理", "#タコス", "#スパイシー", "#渋谷", "#マルガリータ"],
      postedAt: "2023年11月25日",
    },
    {
      id: 23,
      restaurantId: 55,
      restaurantName: "ベトナム料理 サイゴン",
      restaurantEmail: "info@saigon-pho.jp",
      videoUrl: videoUrls[22],
      instagramPostId: "CTTTTTTTTT",
      title: "ベトナム料理 サイゴンのおいしいフォー",
      description: "本場ベトナムの香り豊かなフォーと生春巻きをお楽しみください。 #ベトナム料理 #フォー #生春巻き",
      likes: 1180,
      comments: 84,
      shares: 32,
      user: {
        name: "@saigon_pho",
        avatar: "/placeholder.svg?height=40&width=40",
        instagramHandle: "saigon_pho",
        isVerified: true,
      },
      genre: "ベトナム料理",
      distance: "0.8km",
      rating: 4.4,
      location: "東京都新宿区",
      hashtags: ["#ベトナム料理", "#フォー", "#生春巻き", "#新宿", "#ヘルシー"],
      postedAt: "2023年11月22日",
    },
  ]

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Instagram連携ショート動画フィード - フルスクリーン縦スクロール */}
      <div className="h-screen overflow-y-auto snap-y snap-mandatory">
        {instagramVideos.map((video, index) => (
          <div key={video.id} className="h-screen w-full relative snap-start">
            {/* 動画背景 */}
            <video src={video.videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />

            {/* オーバーレイコンテンツ */}
            <div className="absolute inset-0 flex">
              {/* 左側 - 動画情報 */}
              <div className="flex-1 flex flex-col justify-end p-4 pb-24">
                <div className="text-white">
                  {/* レストランプロフィール */}
                  <div className="mb-3">
                    <button
                      onClick={() => router.push(`/restaurant/${video.restaurantId}`)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                        {video.restaurantName.charAt(0)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{video.user.name}</span>
                        {video.user.isVerified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* 予約・詳細ボタン */}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        setSelectedRestaurant(video)
                        setShowReservationModal(true)
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      今すぐ予約する
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRestaurant(video)
                        setShowStoreDetailModal(true)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center"
                    >
                      もっと見る…
                    </button>
                  </div>
                </div>
              </div>

              {/* 右側 - アクションボタン */}
              <div className="w-16 flex flex-col items-center justify-end pb-20 gap-6">
                {/* いいねボタン */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                  <span className="text-white text-xs font-medium drop-shadow-lg mt-1">
                    {video.likes > 1000 ? `${(video.likes / 1000).toFixed(1)}k` : video.likes}
                  </span>
                </div>

                {/* 保存ボタン */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                </div>

                {/* シェアボタン */}
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 flex items-center justify-center">
                    <Send className="w-8 h-8 text-white drop-shadow-lg" />
                  </button>
                  <span className="text-white text-xs font-medium drop-shadow-lg mt-1">{video.shares}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新しい予約モーダル */}
      {showReservationModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowReservationModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">お店を予約する</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 名前入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">お名前</label>
                <input
                  type="text"
                  value={reservationData.name || ""}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="お名前を入力してください"
                />
              </div>

              {/* 人数選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">人数</label>
                <div className="flex items-center justify-center">
                  <select
                    value={reservationData.people}
                    onChange={(e) =>
                      setReservationData((prev) => ({ ...prev, people: Number.parseInt(e.target.value) }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}名
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 日付選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">日付</label>
                <input
                  type="date"
                  value={reservationData.date}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* 時間帯選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">時間帯</label>
                <select
                  value={reservationData.time}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 11
                    const minute = i % 2 === 0 ? "00" : "30"
                    if (hour > 23) return null
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minute}`
                    return (
                      <option key={timeStr} value={timeStr}>
                        {timeStr}
                      </option>
                    )
                  }).filter(Boolean)}
                </select>
              </div>

              {/* 席タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">席タイプ</label>
                <select
                  value={reservationData.seatType}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, seatType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="指定なし">指定なし</option>
                  <option value="テーブル">テーブル</option>
                  <option value="カウンター">カウンター</option>
                  <option value="個室">個室</option>
                </select>
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">メッセージ（任意）</label>
                <textarea
                  value={reservationData.message}
                  onChange={(e) => setReservationData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="アレルギーや特別なリクエストがあればお書きください"
                />
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  // 予約リクエスト送信処理（現在はUI表示のみ）
                  alert("予約リクエストを送信しました！")
                  setShowReservationModal(false)
                }}
              >
                予約リクエストを送信
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 店舗詳細モーダル */}
      {showStoreDetailModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="sm" onClick={() => setShowStoreDetailModal(false)}>
                ＜
              </Button>
              <h2 className="text-lg font-semibold">店舗詳細</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* 店舗名 */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedRestaurant.restaurantName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRestaurant.rating}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.genre}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.distance}</span>
                </div>
              </div>

              {/* 店舗情報 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">店舗情報</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📍</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">住所</p>
                      <p className="text-sm text-gray-600">東京都渋谷区渋谷1-2-3 渋谷ビル2F</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">📞</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">電話番号</p>
                      <p className="text-sm text-gray-600">03-1234-5678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🕒</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">営業時間</p>
                      <p className="text-sm text-gray-600">月〜土: 11:30-14:00, 17:00-23:00</p>
                      <p className="text-sm text-gray-600">日: 11:30-14:00, 17:00-22:00</p>
                      <p className="text-sm text-red-600">定休日: 火曜日</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">💳</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">決済方法</p>
                      <p className="text-sm text-gray-600">現金、QRコード、電子マネー</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-600 mt-0.5">🗺️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">アクセス</p>
                      <button
                        onClick={() => window.open("https://maps.google.com", "_blank")}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Googleマップで見る
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* インフルエンサーの感想 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">紹介したインフルエンサーの感想</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    今回は、コスパ最強の回らない寿司ランチを紹介！
                    <br />
                    <br />
                    ここは1995年から続く老舗のお寿司屋さんで、29年間も愛され続けている。
                    <br />
                    <br />
                    ここはランチでお得にお寿司をいただけて、握りは1人前で880円、1.5人前で1320円で頂けて超お得。
                    <br />
                    <br />
                    目の前で握ってくれる大将はとても気さくで何度も通いたくなる魅力溢れるお店だった！
                    <br />
                    <br />
                    気になった方はぜひ予約してみてね〜⭐️
                  </p>
                </div>
              </div>

              {/* 予約ボタン */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold"
                onClick={() => {
                  setShowStoreDetailModal(false)
                  setShowReservationModal(true)
                }}
              >
                この店舗を予約する
              </Button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
