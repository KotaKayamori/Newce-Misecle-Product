"use client"

import { Button } from "@/components/ui/button"
import { Settings, Store, Bell, Shield, HelpCircle, Upload, Play, Image, Star, ChevronLeft, Menu, X } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useFollow } from "@/hooks/useFollow"
import { useToast } from "@/hooks/use-toast"
import { useProfileModals } from "./hooks/useProfileModals"
import { GenderAgeScreen } from "./components/GenderAgeScreen"
import { ProfileEditScreen } from "./components/ProfileEditScreen"
import { LogoutConfirmScreen } from "./components/LogoutConfirmScreen"
import { ReviewsScreen } from "./components/ReviewsScreen"
import { NotificationsScreen } from "./components/NotificationsScreen"
import { VisitedStoresScreen } from "./components/VisitedStoresScreen"
import { AccountSettingsScreen } from "./components/AccountSettingsScreen"
import { LocationSettingsScreen } from "./components/LocationSettingsScreen"
import { PushNotificationSettingsScreen } from "./components/PushNotificationSettingsScreen"
import { MutedStoresSettingsScreen } from "./components/MutedStoresSettingsScreen"
import { EmailSettingsScreen } from "./components/EmailSettingsScreen"
import { ContactFormScreen } from "./components/ContactFormScreen"
import { BugReportScreen } from "./components/BugReportScreen"
import { FAQScreen } from "./components/FAQScreen"
import { EmailSuccessScreen } from "./components/EmailSuccessScreen"
import { PasswordSuccessScreen } from "./components/PasswordSuccessScreen"
import { UploadScreen } from "./components/UploadScreen"
import { MyVideosScreen } from "./components/MyVideosScreen"
import { NotificationPermissionScreen } from "./components/NotificationPermissionScreen"
import type { UserVideo, UserAlbum } from "./types"
import { derivePosterUrl, deriveAlbumCoverUrl } from "@/lib/media"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import AlbumViewerOverlay, { AlbumAsset } from "@/components/AlbumViewerOverlay"
import type { RestaurantInfo, ReservationFormData } from "@/lib/types"
import { openReservationForVideo as openReserveShared, openStoreDetailForVideo as openStoreShared } from "@/lib/video-actions"
import { ReservationModal } from "@/components/modals/ReservationModal"
import { StoreDetailModal } from "@/components/modals/StoreDetailModal"

import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { userProfile, loading, error, updateProfile } = useUserProfile()
  const modals = useProfileModals()
  const {
    showReviews,
    setShowReviews,
    showNotifications,
    setShowNotifications,
    showVisitedStores,
    setShowVisitedStores,
    showAccountSettings,
    setShowAccountSettings,
    showLocationSettings,
    setShowLocationSettings,
    showPushNotificationSettings,
    setShowPushNotificationSettings,
    showMutedStoresSettings,
    setShowMutedStoresSettings,
    showEmailSettings,
    setShowEmailSettings,
    showFAQ,
    setShowFAQ,
    showContactForm,
    setShowContactForm,
    showBugReportForm,
    setShowBugReportForm,
    showProfileEdit,
    setShowProfileEdit,
    showLogoutConfirmation,
    setShowLogoutConfirmation,
    showNotificationPermission,
    setShowNotificationPermission,
    showGenderAgeModal,
    setShowGenderAgeModal,
    showUploadModal,
    setShowUploadModal,
    showMyVideosModal,
    setShowMyVideosModal,
  } = modals

  // フォロー機能（自分自身のフォロワー/フォロー数を取得）
  const { 
    followersCount, 
    followingCount 
  } = useFollow(user?.id ?? null)

  // 投稿数
  const [postsCount, setPostsCount] = useState(0)

  const [showEmailSuccess, setShowEmailSuccess] = useState(false)
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("")
  const [emailSuccessType, setEmailSuccessType] = useState<"contact" | "bug">("contact")
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [isSavingGenderAge, setIsSavingGenderAge] = useState(false)
  const [showMenuDrawer, setShowMenuDrawer] = useState(false)
  const [activeTab, setActiveTab] = useState<"video" | "album">("video")

  // 動画・アルバム用state
  const [videos, setVideos] = useState<UserVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [albums, setAlbums] = useState<UserAlbum[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)

  // 予約・店舗詳細モーダル用 state
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantInfo | null>(null)
  const [reservationData, setReservationData] = useState<ReservationFormData>({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  // 動画フルスクリーン用 state
  const [fsOpen, setFsOpen] = useState(false)
  const [fsVideo, setFsVideo] = useState<{ id: string; playback_url: string; poster_url?: string | null; title?: string | null; caption?: string | null } | null>(null)
  const [fsOwnerHandle, setFsOwnerHandle] = useState<string>("")
  const [fsOwnerAvatar, setFsOwnerAvatar] = useState<string | null>(null)
  const [fsOwnerUserId, setFsOwnerUserId] = useState<string | null>(null)
  const [fsMuted, setFsMuted] = useState(false)

  // アルバム全画面表示用 state
  const [albumViewerOpen, setAlbumViewerOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<UserAlbum | null>(null)
  const [albumAssets, setAlbumAssets] = useState<AlbumAsset[]>([])
  const [albumAssetIndex, setAlbumAssetIndex] = useState(0)
  const [albumAssetsLoading, setAlbumAssetsLoading] = useState(false)

  // 動画クリック時
  const handleVideoClick = (video: UserVideo) => {
    const handle = userProfile?.username ? `@${userProfile.username}` : "ユーザー"
    setFsVideo({
      id: video.id,
      playback_url: video.playback_url,
      poster_url: derivePosterUrl(video.playback_url, video.storage_path),
      title: video.title,
      caption: video.caption,
    })
    setFsOwnerHandle(handle)
    setFsOwnerAvatar(userProfile?.avatar_url ?? null)
    setFsOwnerUserId(video.owner_id)
    setFsMuted(false)
    setFsOpen(true)
  }

  useEffect(() => {
    if (error === "PROFILE_NOT_FOUND") {
      router.push("/register")
    }
  }, [error, router])

  // アルバムクリック時
  const handleAlbumClick = async (album: UserAlbum) => {
    setSelectedAlbum(album)
    setAlbumAssetsLoading(true)
    setAlbumViewerOpen(true)
    setAlbumAssetIndex(0)
    try {
      const res = await fetch(`/api/guidebook/albums/${album.id}/assets`, { cache: "no-store" })
      if (!res.ok) throw new Error("アルバムの取得に失敗しました")
      const json = await res.json()
      const assets: AlbumAsset[] = Array.isArray(json?.items)
        ? json.items.map((asset: any) => ({
            id: asset.id,
            url: asset.url,
            order: asset.order,
            type: asset.type,
            width: asset.width,
            height: asset.height,
          }))
        : []
      setAlbumAssets(assets)
    } catch (err) {
      setAlbumAssets([])
    } finally {
      setAlbumAssetsLoading(false)
    }
  }

  // 自分の動画取得
  useEffect(() => {
    if (!user?.id) return
    setVideosLoading(true)
    supabase
      .from("videos")
      .select("id, owner_id, playback_url, storage_path, title, caption, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setVideos([])
        else setVideos(data || [])
        setVideosLoading(false)
      })
  }, [user?.id])

  // 自分のアルバム取得
  useEffect(() => {
    if (!user?.id) return
    setAlbumsLoading(true)
    supabase
      .from("photo_albums")
      .select("id, owner_id, title, caption, cover_path, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setAlbums([])
        else setAlbums(data || [])
        setAlbumsLoading(false)
      })
  }, [user?.id])

  // 自分の動画取得
  useEffect(() => {
    if (!user?.id) return
    setVideosLoading(true)
    supabase
      .from("videos")
      .select("id, owner_id, playback_url, storage_path, title, caption, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setVideos([])
        else setVideos(data || [])
        setVideosLoading(false)
      })
  }, [user?.id])

  // 自分のアルバム取得
  useEffect(() => {
    if (!user?.id) return
    setAlbumsLoading(true)
    supabase
      .from("photo_albums")
      .select("id, owner_id, title, caption, cover_path, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setAlbums([])
        else setAlbums(data || [])
        setAlbumsLoading(false)
      })
  }, [user?.id])

  const visitHistory = [
    {
      id: 1,
      restaurantName: "カフェ・ド・パリ",
      date: "2024年1月10日",
      rating: 4.5,
      review: "雰囲気が良く、料理も美味しかったです。",
      image: "/placeholder.svg?height=60&width=80",
      reservationSource: {
        type: "video",
        videoId: "VID_002",
        influencer: "@cafe_hopping_girl",
        videoTitle: "カフェ・ド・パリの絶品パンケーキ！ふわふわで最高",
        videoThumbnail: "/placeholder.svg?height=40&width=60",
      },
      storeInfo: {
        address: "東京都渋谷区神宮前4-12-10 表参道ヒルズ2F",
        phone: "03-3497-8901",
        hours: "8:00-22:00（L.O.21:30）",
        access: "東京メトロ表参道駅A2出口より徒歩1分",
      },
    },
    {
      id: 2,
      restaurantName: "焼肉 炭火亭",
      date: "2024年1月5日",
      rating: 4.8,
      review: "お肉の質が素晴らしく、サービスも丁寧でした。",
      image: "/placeholder.svg?height=60&width=80",
      reservationSource: {
        type: "video",
        videoId: "VID_003",
        influencer: "@meat_master_tokyo",
        videoTitle: "焼肉 炭火亭の極上和牛！口の中でとろける美味しさ",
        videoThumbnail: "/placeholder.svg?height=40&width=60",
      },
      storeInfo: {
        address: "東京都新宿区歌舞伎町1-14-7 林ビル3F",
        phone: "03-3209-5678",
        hours: "17:00-翌2:00（L.O.翌1:30）",
        access: "JR新宿駅東口より徒歩5分",
      },
    },
    {
      id: 3,
      restaurantName: "パスタ・ハウス",
      date: "2023年12月28日",
      rating: 4.2,
      review: "パスタが本格的で美味しかったです。",
      image: "/placeholder.svg?height=60&width=80",
      reservationSource: {
        type: "direct",
        method: "アプリから直接予約",
      },
      storeInfo: {
        address: "東京都渋谷区渋谷2-15-8 パスタビル1F",
        phone: "03-3456-7890",
        hours: "11:30-22:00（L.O.21:30）",
        access: "JR渋谷駅東口より徒歩7分",
      },
    },
  ]

  const notifications = [
    {
      id: 1,
      title: "新機能のお知らせ",
      message: "キャンセル待ち通知機能が追加されました。人気店舗の空席情報をいち早くお知らせします。",
      date: "2024年1月15日",
      read: false,
    },
    {
      id: 2,
      title: "予約完了",
      message: "焼肉 炭火亭 新宿店の予約が確定しました。ご来店お待ちしております。",
      date: "2024年1月14日",
      read: true,
    },
    {
      id: 3,
      title: "フォロー中のユーザーからのお知らせ",
      message: "グルメ太郎さんが新しい動画を投稿しました。",
      date: "2024年1月13日",
      read: true,
    },
  ]

  const showEmailSuccessMessage = (type: "contact" | "bug", message: string) => {
    setEmailSuccessType(type)
    setEmailSuccessMessage(message)
    setShowEmailSuccess(true)

    setTimeout(() => {
      setShowEmailSuccess(false)
    }, 5000)
  }

  const genderOptions = ["男性", "女性", "その他"] as const
  const ageOptions = ["10代", "20代", "30代", "40代", "50代以上"] as const

  const handleSaveGenderAge = async (
    gender: string,
    age: string
  ) => {
    if (!genderOptions.includes(gender as any) || !ageOptions.includes(age as any)) {
      toast({
        title: "入力エラー",
        description: "性別と年齢を選択してください",
        variant: "destructive",
      })
      return
    }

    setIsSavingGenderAge(true)
    try {
      const success = await updateProfile({
        gender: gender as "男性" | "女性" | "その他",
        age: age as "10代" | "20代" | "30代" | "40代" | "50代以上",
      })
      if (success) {
        toast({
          title: "更新完了",
          description: "性別と年齢を更新しました",
        })
        setShowGenderAgeModal(false)
      }
    } catch (updateError) {
      console.error("Gender/Age update error:", updateError)
      toast({
        title: "更新エラー",
        description: "性別と年齢の更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSavingGenderAge(false)
    }
  }

  const handleLogout = () => {
    setShowMenuDrawer(false)
    setShowLogoutConfirmation(true)
  }

  const confirmLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (logoutError) {
      console.error("Logout error:", logoutError)
      toast({
        title: "ログアウトエラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleEnableNotifications = async () => {
    alert("通知を許可しました！")
    setShowNotificationPermission(false)
  }

  const menuItems = [
    {
      category: "アカウント",
      items: [
        { icon: Upload, label: "コンテンツをアップロード", onClick: () => { setShowMenuDrawer(false); setShowUploadModal(true) } },
        { icon: Play, label: "自分の動画", onClick: () => { setShowMenuDrawer(false); setShowMyVideosModal(true) } },
        { icon: Settings, label: "パスワード設定", onClick: () => { setShowMenuDrawer(false); setShowAccountSettings(true) } },
        { icon: Shield, label: "ログアウト", onClick: () => handleLogout() },
      ],
    },
    {
      category: "店舗",
      items: [
        { icon: Store, label: "これまで来店した店舗", onClick: () => { setShowMenuDrawer(false); setShowVisitedStores(true) } },
      ],
    },
    {
      category: "通知とプライバシー",
      items: [
        { icon: Bell, label: "位置情報の設定", onClick: () => { setShowMenuDrawer(false); setShowLocationSettings(true) } },
        { icon: Bell, label: "プッシュ通知設定", onClick: () => { setShowMenuDrawer(false); setShowNotificationPermission(true) } },
        { icon: Shield, label: "ミュートにしている店舗", onClick: () => { setShowMenuDrawer(false); setShowMutedStoresSettings(true) } },
      ],
    },
    {
      category: "サポート",
      items: [
        { icon: HelpCircle, label: "お問い合わせ", onClick: () => { setShowMenuDrawer(false); setShowContactForm(true) } },
        { icon: HelpCircle, label: "よくある質問", onClick: () => { setShowMenuDrawer(false); setShowFAQ(true) } },
        { icon: HelpCircle, label: "アプリの不具合や、改善要望を報告", onClick: () => { setShowMenuDrawer(false); setShowBugReportForm(true) } },
        { icon: HelpCircle, label: "サービスサイトはこちら", onClick: () => window.open("https://service.newce.co.jp", "_blank") },
        { icon: HelpCircle, label: "店舗様はこちら", onClick: () => window.open("https://ad.newce.co.jp", "_blank") },
      ],
    },
  ]

  // Menu Drawer Component
  const MenuDrawer = () => (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setShowMenuDrawer(false)}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-xl">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">メニュー</h2>
          <button onClick={() => setShowMenuDrawer(false)} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-sm font-bold text-black mb-2">{section.category}</h3>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={itemIndex}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-800 text-sm">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-3">
          <div className="relative flex items-center justify-center">
            <h1 className="text-lg font-semibold">マイページ</h1>
          </div>
        </div>

        {/* Login Required */}
        <div className="px-6 py-12">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">ログインが必要です</h1>
            <p className="text-gray-600 mb-6">プロフィールを表示するにはログインしてください。</p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full"
            >
              ログインする
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showEmailSuccess) {
    return (
      <EmailSuccessScreen
        onClose={() => {
          setShowEmailSuccess(false)
          setShowContactForm(false)
          setShowBugReportForm(false)
        }}
        message={emailSuccessMessage}
        type={emailSuccessType}
      />
    )
  }

  if (showPasswordSuccess) {
    return <PasswordSuccessScreen onClose={() => setShowPasswordSuccess(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700 text-white">
            再試行
          </Button>
        </div>
      </div>
    )
  }

  if (showGenderAgeModal) {
    return (
      <GenderAgeScreen
        onClose={() => setShowGenderAgeModal(false)}
        initialGender={userProfile?.gender || ""}
        initialAge={userProfile?.age || ""}
        onSave={handleSaveGenderAge}
        isUpdating={isSavingGenderAge}
        error={error}
      />
    )
  }

  if (showProfileEdit) {
    return (
      <ProfileEditScreen
        onClose={() => setShowProfileEdit(false)}
        userProfile={userProfile}
        userId={user?.id ?? null}
        onUpdate={updateProfile}
        onOpenGenderAge={() => setShowGenderAgeModal(true)}
      />
    )
  }

  if (showLogoutConfirmation) {
    return (
      <LogoutConfirmScreen
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={confirmLogout}
      />
    )
  }

  if (showReviews) {
    return <ReviewsScreen onClose={() => setShowReviews(false)} visitHistory={visitHistory} />
  }

  if (showNotifications) {
    return <NotificationsScreen onClose={() => setShowNotifications(false)} notifications={notifications} />
  }

  if (showVisitedStores) {
    return <VisitedStoresScreen onClose={() => setShowVisitedStores(false)} />
  }

  if (showAccountSettings) {
    return (
      <AccountSettingsScreen
        onClose={() => setShowAccountSettings(false)}
        user={user}
        onPasswordResetSuccess={() => {
          setShowPasswordSuccess(true)
          setShowAccountSettings(false)
        }}
      />
    )
  }

  if (showLocationSettings) {
    return <LocationSettingsScreen onClose={() => setShowLocationSettings(false)} />
  }

  if (showPushNotificationSettings) {
    return <PushNotificationSettingsScreen onClose={() => setShowPushNotificationSettings(false)} />
  }

  if (showMutedStoresSettings) {
    return <MutedStoresSettingsScreen onClose={() => setShowMutedStoresSettings(false)} />
  }

  if (showEmailSettings) {
    return <EmailSettingsScreen onClose={() => setShowEmailSettings(false)} />
  }

  if (showContactForm) {
    return (
      <ContactFormScreen
        onClose={() => setShowContactForm(false)}
        onSuccess={(type, message) => showEmailSuccessMessage(type, message)}
      />
    )
  }

  if (showBugReportForm) {
    return (
      <BugReportScreen
        onClose={() => setShowBugReportForm(false)}
        onSuccess={(type, message) => showEmailSuccessMessage(type, message)}
        onShowFAQ={() => {
          setShowBugReportForm(false)
          setShowFAQ(true)
        }}
      />
    )
  }

  if (showFAQ) {
    return <FAQScreen onClose={() => setShowFAQ(false)} />
  }

  if (showUploadModal) {
    return <UploadScreen onClose={() => setShowUploadModal(false)} />
  }

  if (showMyVideosModal) {
    return <MyVideosScreen onClose={() => setShowMyVideosModal(false)} />
  }

  if (showNotificationPermission) {
    return (
      <NotificationPermissionScreen
        onClose={() => setShowNotificationPermission(false)}
        onEnable={handleEnableNotifications}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Menu Drawer */}
      {showMenuDrawer && <MenuDrawer />}

      {/* Header - Instagram style */}
      <div className="bg-white px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="w-8"></div>
          <span className="text-base font-semibold">
            @{userProfile?.username || "username"}
          </span>
          <button onClick={() => setShowMenuDrawer(true)} className="p-1">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-4">
        {/* Profile Info Row */}
        <div className="flex items-center gap-6 mb-4">
          {/* Avatar */}
          <img
            src={userProfile?.avatar_url || "/images/misecle-mascot.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
          />
          
          {/* Stats */}
          <div className="flex-1">
            {/* <h2 className="text-xl font-bold mb-2">{userProfile?.name || "ユーザー"}</h2> */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-bold text-lg">{videos.length + albums.length}</div>
                <div className="text-xs text-gray-500">投稿</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{followersCount}</div>
                <div className="text-xs text-gray-500">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{followingCount}</div>
                <div className="text-xs text-gray-500">フォロー中</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-4">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {userProfile?.profile}
          </p>
        </div>

        {/* SNS Link */}
        {userProfile?.sns_link && (
          <div className="mb-4">
            <a 
              href={userProfile.sns_link.startsWith('http') ? userProfile.sns_link : `https://${userProfile.sns_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {userProfile.sns_link}
            </a>
          </div>
        )}

        {/* Edit Profile Button */}
        <Button
          onClick={() => setShowProfileEdit(true)}
          variant="outline"
          className="w-full border-gray-300 text-gray-800 font-medium py-2 rounded-lg"
        >
          プロフィールを編集
        </Button>
      </div>

      {/* 動画フルスクリーンオーバーレイ */}
      {fsOpen && fsVideo && (
        <VideoFullscreenOverlay
          open={fsOpen}
          video={fsVideo}
          ownerHandle={fsOwnerHandle}
          ownerAvatarUrl={fsOwnerAvatar}
          ownerUserId={fsOwnerUserId}
          muted={fsMuted}
          onToggleMuted={() => setFsMuted((m) => !m)}
          onClose={() => setFsOpen(false)}
          onShare={async () => {
            try {
              if ((navigator as any).share) {
                await (navigator as any).share({ url: fsVideo.playback_url })
              } else {
                await navigator.clipboard.writeText(fsVideo.playback_url)
                alert("リンクをコピーしました")
              }
            } catch {}
          }}
          onReserve={() => {
            openReserveShared(
              { setSelectedRestaurant, setShowReservationModal, setShowFullscreenVideo: setFsOpen as any },
              { id: fsVideo.id, title: fsVideo.title as any } as any,
              { keepFullscreen: true }
            )
          }}
          onMore={() => {
            const videoForModal = {
              id: fsVideo.id,
              title: fsVideo.title as any,
              caption: fsVideo.caption as any,
              owner_label: fsOwnerHandle || null,
              owner_avatar_url: fsOwnerAvatar || null,
            }
            openStoreShared(
              { setSelectedRestaurant, setShowStoreDetailModal },
              videoForModal as any,
              { keepFullscreen: true }
            )
          }}
        />
      )}      

      {/* 予約モーダル */}
      <ReservationModal
        open={showReservationModal}
        restaurant={selectedRestaurant}
        data={reservationData}
        onChange={(values) => setReservationData((prev) => ({ ...prev, ...values }))}
        onClose={() => setShowReservationModal(false)}
        onSubmit={() => {
          alert("予約リクエストを送信しました！")
          setShowReservationModal(false)
        }}
      />

      {/* 店舗詳細モーダル */}
      <StoreDetailModal
        open={showStoreDetailModal}
        restaurant={selectedRestaurant}
        onClose={() => setShowStoreDetailModal(false)}
        onReserve={() => setShowReservationModal(true)}
      />

      {/* アルバム全画面オーバーレイ */}
      {selectedAlbum && (
        <AlbumViewerOverlay
          open={albumViewerOpen}
          assets={albumAssets}
          index={albumAssetIndex}
          loading={albumAssetsLoading}
          onClose={() => setAlbumViewerOpen(false)}
          onIndexChange={(next) => {
            const clamped = Math.max(0, Math.min(next, albumAssets.length - 1))
            setAlbumAssetIndex(clamped)
          }}
          title={selectedAlbum.title}
          ownerAvatarUrl={userProfile?.avatar_url}
          ownerLabel={`@${userProfile?.username || "user"}`}
          ownerUserId={user?.id}
          description={selectedAlbum.caption}
          onShare={async () => {
            const url = albumAssets[albumAssetIndex]?.url
            if (!url) return
            try {
              if (navigator.share) await navigator.share({ url })
              else {
                await navigator.clipboard.writeText(url)
                alert("リンクをコピーしました")
              }
            } catch {}
          }}
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "video"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            動画
          </button>
          <button
            onClick={() => setActiveTab("album")}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "album"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400"
            }`}
          >
            アルバム
          </button>
        </div>
      </div>

      {/* Content Area - 3カラムグリッド、サムネイルのみ */}
      <div>
        {activeTab === "video" ? (
          videosLoading ? (
            <div className="py-8 text-center text-gray-500">読み込み中…</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">まだ動画がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[1px]">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="aspect-square relative overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={derivePosterUrl(video.playback_url, video.storage_path) || "/placeholder.jpg"}
                    alt={video.title || "動画"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white drop-shadow-lg" fill="white" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          albumsLoading ? (
            <div className="py-8 text-center text-gray-500">読み込み中…</div>
          ) : albums.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">まだアルバムがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[1px]">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => handleAlbumClick(album)}
                  className="aspect-square relative overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={deriveAlbumCoverUrl(album.cover_path) || "/placeholder.jpg"}
                    alt={album.title || "アルバム"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Image className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
