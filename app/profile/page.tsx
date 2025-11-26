"use client"

import { Button } from "@/components/ui/button"
import { Settings, Store, Bell, Shield, HelpCircle, Upload, Play, Star } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/useUserProfile"
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

  const [showEmailSuccess, setShowEmailSuccess] = useState(false)
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("")
  const [emailSuccessType, setEmailSuccessType] = useState<"contact" | "bug">("contact")
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [isSavingGenderAge, setIsSavingGenderAge] = useState(false)

  useEffect(() => {
    if (error === "PROFILE_NOT_FOUND") {
      router.push("/register")
    }
  }, [error, router])

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
        { icon: Upload, label: "コンテンツをアップロード", onClick: () => setShowUploadModal(true) },
        { icon: Play, label: "自分の動画", onClick: () => setShowMyVideosModal(true) },
        { icon: Settings, label: "パスワード設定", onClick: () => setShowAccountSettings(true) },
        { icon: Shield, label: "ログアウト", onClick: () => handleLogout() },
      ],
    },
    {
      category: "店舗",
      items: [
        { icon: Store, label: "これまで来店した店舗", onClick: () => setShowVisitedStores(true) },
      ],
    },
    {
      category: "通知とプライバシー",
      items: [
        { icon: Bell, label: "位置情報の設定", onClick: () => setShowLocationSettings(true) },
        { icon: Bell, label: "プッシュ通知設定", onClick: () => setShowNotificationPermission(true) },
        { icon: Shield, label: "ミュートにしている店舗", onClick: () => setShowMutedStoresSettings(true) },
      ],
    },
    {
      category: "サポート",
      items: [
        { icon: HelpCircle, label: "お問い合わせ", onClick: () => setShowContactForm(true) },
        { icon: HelpCircle, label: "よくある質問", onClick: () => setShowFAQ(true) },
        { icon: HelpCircle, label: "アプリの不具合や、改善要望を報告", onClick: () => setShowBugReportForm(true) },
        { icon: HelpCircle, label: "サービスサイトはこちら", onClick: () => window.open("https://service.newce.co.jp", "_blank") },
        { icon: HelpCircle, label: "店舗様はこちら", onClick: () => window.open("https://ad.newce.co.jp", "_blank") },
      ],
    },
    // 運営機能セクションは削除済み
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="bg-white px-6 py-4">
          <div className="relative flex items-center justify-center">
            <h1 className="text-xl font-semibold">マイページ</h1>
          </div>
        </div>

        {/* Login Required (お気に入りページと同様の見た目) */}
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

        {/* Footer */}
        <Navigation />
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
      <div className="bg-white px-6 py-4">
        <div className="relative flex items-center justify-center">
          <h1 className="text-xl font-semibold">マイページ</h1>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4 bg-white">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-4">
              <img
                src={userProfile?.avatar_url || "/images/misecle-mascot.png"}
                alt="Profile Icon"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-xl">{userProfile?.username || "ユーザー"}</h3>
                <p className="text-gray-600 text-sm">{userProfile?.name || ""}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowProfileEdit(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-12 rounded-full w-full max-w-xs"
            >
              プロフィールを編集する
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 px-2">{section.category}</h3>
              <div className="bg-white rounded-lg overflow-hidden">
                {section.items.map((item, itemIndex) => {
                  const IconComponent = item.icon
                  return (
                    <div key={itemIndex}>
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-800">{item.label}</span>
                        </div>
                        <span className="text-black">＞</span>
                      </button>
                      {itemIndex < section.items.length - 1 && <div className="border-b border-gray-200 mx-4"></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
