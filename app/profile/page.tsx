"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import VideoUploader from "@/components/uploader/VideoUploader"
import MyVideosPanel from "@/components/my-videos/MyVideosPanel"
import { Star, Settings, Store, Bell, Shield, HelpCircle, CheckCircle, Upload, Play } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { mockUserStats } from "@/lib/mock-data"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/useUserProfile"
import { sendSupportInquiryAction, sendBugReportAction } from "@/app/actions/email-actions"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { userProfile, loading, error, updateProfile } = useUserProfile()
  const [showReviews, setShowReviews] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showVisitedStores, setShowVisitedStores] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showLocationSettings, setShowLocationSettings] = useState(false)
  const [showPushNotificationSettings, setShowPushNotificationSettings] = useState(false)
  const [showMutedStoresSettings, setShowMutedStoresSettings] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showBugReportForm, setShowBugReportForm] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showOtherProfile, setShowOtherProfile] = useState(false)
  const [expandedOccupation, setExpandedOccupation] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showManagementScreen, setShowManagementScreen] = useState(false)
  const [showNotificationBroadcast, setShowNotificationBroadcast] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sentNotifications, setSentNotifications] = useState([])

  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showPosts, setShowPosts] = useState(false)
  const [selectedStatsTab, setSelectedStatsTab] = useState("followers")

  const [selectedVideo, setSelectedVideo] = useState(null)
  const [emailAddress, setEmailAddress] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [showStoreDetails, setShowStoreDetails] = useState<number | null>(null)

  // Add a new state variable for showing the notification permission modal
  const [showNotificationPermission, setShowNotificationPermission] = useState(false)
  const [contactSending, setContactSending] = useState(false)
  const [bugSending, setBugSending] = useState(false)

  // Add new state variables for gender and age selection
  const [showGenderAgeModal, setShowGenderAgeModal] = useState(false)
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAge, setSelectedAge] = useState("")

  // 動画アップロード/自分の動画 モーダル
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMyVideosModal, setShowMyVideosModal] = useState(false)

  // プロフィール編集用のstate
  const [editedName, setEditedName] = useState("")
  const [editedUsername, setEditedUsername] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [profileUploadProgress, setProfileUploadProgress] = useState<number>(0)

  // メール送信完了メッセージ用のstate
  const [showEmailSuccess, setShowEmailSuccess] = useState(false)
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("")
  const [emailSuccessType, setEmailSuccessType] = useState<"contact" | "bug">("contact")

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  // パスワード再設定用のstate
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetEmailAddress, setResetEmailAddress] = useState<string | null>(null)

  // プロフィールデータの初期化
  useEffect(() => {
    if (userProfile) {
      setEditedName(userProfile.name || "")
      setEditedUsername(userProfile.username || "")
      setSelectedGender(userProfile.gender || "")
      setSelectedAge(userProfile.age || "")
    }
  }, [userProfile])

  // プロフィールが存在しない場合の処理
  useEffect(() => {
    if (error === 'PROFILE_NOT_FOUND') {
      router.push('/register')
    }
  }, [error, router])

  // メール送信成功メッセージの表示関数
  const showEmailSuccessMessage = (type: "contact" | "bug", message: string) => {
    setEmailSuccessType(type)
    setEmailSuccessMessage(message)
    setShowEmailSuccess(true)
    
    // 5秒後に自動的に非表示
    setTimeout(() => {
      setShowEmailSuccess(false)
    }, 5000)
  }

  // プロフィール編集画面を開く際の処理
  const handleOpenProfileEdit = () => {
    if (userProfile) {
      // 最新のプロフィール情報をフォームに設定
      setEditedName(userProfile.name || "")
      setEditedUsername(userProfile.username || "")
      setSelectedGender(userProfile.gender || "")
      setSelectedAge(userProfile.age || "")
    }
    setShowProfileEdit(true)
  }

  // 性別・年齢モーダルを開く際の処理
  const handleOpenGenderAgeModal = () => {
    if (userProfile) {
      // 現在の値をモーダルに設定
      setSelectedGender(userProfile.gender || "")
      setSelectedAge(userProfile.age || "")
    }
    setShowGenderAgeModal(true)
  }

  // パスワード変更関数
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "新しいパスワードが一致しません",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "パスワードエラー",
        description: "新しいパスワードは6文字以上で入力してください",
        variant: "destructive",
      })
      return
    }

    if (currentPassword === newPassword) {
      toast({
        title: "パスワードエラー",
        description: "現在のパスワードと同じパスワードは使用できません",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      // 現在のパスワードで再認証
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      })

      if (signInError) {
        toast({
          title: "認証エラー",
          description: "現在のパスワードが正しくありません",
          variant: "destructive",
        })
        return
      }

      // パスワード更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        toast({
          title: "更新エラー",
          description: updateError.message || "パスワードの更新に失敗しました",
          variant: "destructive",
        })
        return
      }

      // 成功時の処理
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "パスワードを変更しました",
        description: "再ログインしてください。",
      })

      await supabase.auth.signOut()
      router.replace("/auth/login?password_changed=1")

    } catch (error: any) {
      console.error('Password change error:', error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // パスワード忘れた場合の処理
  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast({
        title: "エラー",
        description: "メールアドレスが取得できません",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        toast({
          title: "送信エラー",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "送信完了",
        description: "パスワードリセット用のメールを送信しました。メールを確認してください。",
      })

      setResetEmailSent(true)
      setResetEmailAddress(user.email)

    } catch (error: any) {
      console.error('Password reset error:', error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました",
        variant: "destructive",
      })
      setResetEmailSent(false)
      setResetEmailAddress(null)
    }
  }

  // メール送信成功画面
  if (showEmailSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 pb-20">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">送信完了</h2>
            <p className="text-gray-600 leading-relaxed">
              {emailSuccessMessage}
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                {emailSuccessType === "contact" 
                  ? "お問い合わせ内容を確認後、必要に応じてご連絡いたします。"
                  : "開発チームが内容を確認し、アプリの改善に活用させていただきます。"
                }
              </p>
            </div>

            <Button
              onClick={() => {
                setShowEmailSuccess(false)
                if (emailSuccessType === "contact") {
                  setShowContactForm(false)
                } else {
                  setShowBugReportForm(false)
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            >
              マイページに戻る
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowEmailSuccess(false)
                // フォームをそのまま表示（別のメッセージを送信したい場合）
              }}
              className="w-full py-3 text-lg font-semibold"
            >
              {emailSuccessType === "contact" ? "別のお問い合わせを送信" : "別の報告を送信"}
            </Button>
          </div>
        </div>
        
        <Navigation />
      </div>
    )
  }

  // パスワード変更成功画面
  if (showPasswordSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 pb-20">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">パスワード変更完了</h2>
            <p className="text-gray-600 leading-relaxed">
              パスワードが正常に変更されました。<br />
              新しいパスワードでログインしてください。
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                セキュリティのため、定期的にパスワードを変更することをお勧めします。
              </p>
            </div>
          </div>
        </div>
        
        <Navigation />
      </div>
    )
  }

  // 画像選択ハンドラー
  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ファイルサイズエラー",
          description: "画像ファイルは5MB以下にしてください。",
          variant: "destructive",
        })
        return
      }

      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "ファイル形式エラー",
          description: "JPEG、PNG、GIF、WebP形式の画像ファイルを選択してください。",
          variant: "destructive",
        })
        return
      }

      setSelectedProfileImage(file)
      
      // プレビュー用のURL作成
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // プロフィール画像を削除
  const handleProfileImageRemove = () => {
    setSelectedProfileImage(null)
    setProfileImagePreview(null)
    
    // input要素をリセット
    const fileInput = document.getElementById('profile-image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // 画像をSupabase Storageにアップロード
  const uploadProfileImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploadingProfile(true)
      setProfileUploadProgress(0)

      // ファイル名を生成（ユーザーIDと現在時刻を使用してユニークにする）
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-profile-${Date.now()}.${fileExt}`
      const filePath = fileName

      console.log('Uploading profile image to:', filePath)

      setProfileUploadProgress(20)

      // Supabase Storageにアップロード
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`アップロードエラー: ${error.message}`)
      }

      setProfileUploadProgress(70)

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfileUploadProgress(100)
      console.log('Profile image uploaded successfully:', publicUrl)

      return publicUrl
    } catch (error: any) {
      console.error('Failed to upload profile image:', error)
      toast({
        title: "アップロードエラー",
        description: error.message || "画像のアップロードに失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploadingProfile(false)
      setProfileUploadProgress(0)
    }
  }

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
      title: "メンテナンスのお知らせ",
      message: "1月20日 2:00-4:00にシステムメンテナンスを実施いたします。ご利用いただけない時間がございます。",
      date: "2024年1月12日",
      read: true,
    },
    {
      id: 3,
      title: "プレミアム会員特典追加",
      message: "プレミアム会員様限定で、新たに5つの提携店舗が追加されました。ぜひご利用ください。",
      date: "2024年1月8日",
      read: true,
    },
  ]

  // プロフィール編集の保存処理
  const handleSaveProfile = async () => {
    const updates: any = {
      name: editedName.trim(),
      username: editedUsername.trim(),
    }

    if (!updates.name || !updates.username) {
      toast({
        title: "入力エラー",
        description: "名前とユーザーネームを入力してください",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    
    try {
      // 画像がアップロードされている場合は、まずStorageにアップロード
      if (selectedProfileImage && user) {
        const uploadedUrl = await uploadProfileImageToStorage(selectedProfileImage, user.id)
        if (uploadedUrl) {
          updates.avatar_url = uploadedUrl
        } else {
          // 画像アップロードに失敗した場合
          setIsUpdating(false)
          return
        }
      }

      // プロフィール情報を更新
      const success = await updateProfile(updates)
      
      if (success) {
        toast({
          title: "更新完了",
          description: "プロフィールを更新しました",
        })
        
        // アップロード関連のstateをリセット
        setSelectedProfileImage(null)
        setProfileImagePreview(null)
        setShowProfileEdit(false)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "更新エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveGenderAge = async () => {
    const updates: any = {
      gender: selectedGender,
      age: selectedAge,
    }

    if (!updates.gender || !updates.age) {
      toast({
        title: "入力エラー",
        description: "性別と年齢を選択してください",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    
    try {
      // プロフィール情報を更新
      const success = await updateProfile(updates)
      
      if (success) {
        toast({
          title: "更新完了",
          description: "性別と年齢を更新しました",
        })
        
        setShowGenderAgeModal(false)
      }
    } catch (error) {
      console.error('Gender/Age update error:', error)
      toast({
        title: "更新エラー",
        description: "性別と年齢の更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutConfirmation(true)
  }

  const confirmLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: "ログアウトエラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
    }
  }

  // ローディング中の表示
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

  // エラー時の表示
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-20 flex items-center justify-center">
        <div className="text-white text-center px-6">
          <p className="text-gray-300 mb-4">プロフィールを表示するにはログインが必要です</p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            ログインする
          </Button>
        </div>
        <Navigation />
      </div>
    )
  }

  const menuItems = [
    {
      category: "アカウント",
      items: [
        { icon: Upload, label: "コンテンツをアップロード", onClick: () => setShowUploadModal(true) },
        { icon: Play, label: "自分の動画", onClick: () => setShowMyVideosModal(true) },
        { icon: Settings, label: "パスワード設定", onClick: () => setShowAccountSettings(true) },
        { icon: Settings, label: "ログアウト", onClick: () => handleLogout() },
      ],
    },
    {
      category: "店舗",
      items: [{ icon: Store, label: "これまで来店した店舗", onClick: () => setShowVisitedStores(true) }],
    },
    {
      category: "通知とプライバシー",
      items: [
        { icon: Bell, label: "位置情報の設定", onClick: () => setShowLocationSettings(true) },
        // Update the Bell icon menu item to trigger the notification permission modal
        { icon: Bell, label: "プッシュ通知設定", onClick: () => setShowNotificationPermission(true) },
        { icon: Shield, label: "ミュートにしている店舗", onClick: () => setShowMutedStoresSettings(true) },
      ],
    },
    {
      category: "サポート",
      items: [
        { icon: HelpCircle, label: "お問い合わせ", onClick: () => setShowContactForm(true) },
        { icon: HelpCircle, label: "よくある質問", onClick: () => setShowFAQ(true) },
        { icon: HelpCircle, label: "アプリの不具合・改善要望を報告", onClick: () => setShowBugReportForm(true) },
      ],
    },
  ]

  const mockUnlinkedVideos = [
    {
      id: 1,
      videoId: "VID_001",
      thumbnail: "/placeholder.svg?height=120&width=120",
      caption: "美味しい焼き鳥が自慢の居酒屋「鳥心」渋谷店で撮影！ #焼き鳥 #居酒屋 #渋谷グルメ",
      extractedInfo: {
        storeName: "鳥心 渋谷店",
        address: "東京都渋谷区道玄坂2-10-12 新大宗ビル1号館B1F",
        phoneNumber: "03-5784-2345",
        businessHours: "17:00-24:00（L.O.23:30）",
        paymentMethods: "現金、クレジットカード、電子マネー",
        access: "JR渋谷駅ハチ公口より徒歩3分",
        tags: ["焼き鳥", "居酒屋", "渋谷グルメ"],
      },
      influencer: {
        name: "@tokyo_gourmet_lover",
        impression: "焼き鳥が本当に美味しくて、特に手羽先が絶品でした！雰囲気も良くてデートにもおすすめです.",
      },
      isLinked: false,
    },
    {
      id: 2,
      videoId: "VID_002",
      thumbnail: "/placeholder.svg?height=120&width=120",
      caption: "カフェ・ド・パリの絶品パンケーキ！ふわふわで最高 #カフェ #パンケーキ #表参道",
      extractedInfo: {
        storeName: "カフェ・ド・パリ",
        address: "東京都渋谷区神宮前4-12-10 表参道ヒルズ2F",
        phoneNumber: "03-3497-8901",
        businessHours: "8:00-22:00（L.O.21:30）",
        paymentMethods: "現金、クレジットカード、PayPay",
        access: "東京メトロ表参道駅A2出口より徒歩1分",
        tags: ["カフェ", "パンケーキ", "表参道"],
      },
      influencer: {
        name: "@cafe_hopping_girl",
        impression: "パンケーキがふわふわで感動しました！コーヒーも香り高くて、朝から贅沢な気分になれます.",
      },
      isLinked: false,
    },
    {
      id: 3,
      videoId: "VID_003",
      thumbnail: "/placeholder.svg?height=120&width=120",
      caption: "焼肉 炭火亭の極上和牛！口の中でとろける美味しさ #焼肉 #和牛 #新宿",
      extractedInfo: {
        storeName: "焼肉 炭火亭",
        address: "東京都新宿区歌舞伎町1-14-7 林ビル3F",
        phoneNumber: "03-3209-5678",
        businessHours: "17:00-翌2:00（L.O.翌1:30）",
        paymentMethods: "現金、クレジットカード、電子マネー、QRコード決済",
        access: "JR新宿駅東口より徒歩5分",
        tags: ["焼肉", "和牛", "新宿"],
      },
      influencer: {
        name: "@meat_master_tokyo",
        impression: "A5ランクの和牛が本当に美味しい！炭火で焼いた香ばしさと肉の旨味が最高でした.",
      },
      isLinked: false,
    },
  ]

  const handleLinkVideo = async (video) => {
    if (!emailAddress.trim()) {
      alert("メールアドレスを入力してください")
      return
    }

    setIsLinking(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    alert(
      `動画ID: ${video.videoId} と店舗「${video.extractedInfo.storeName}」がメールアドレス「${emailAddress}」に紐付けられました！`,
    )
    setSelectedVideo(null)
    setEmailAddress("")
    setIsLinking(false)
  }

  // 性別・年齢モーダル（データベースから取得した値を表示）
  if (showGenderAgeModal) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowGenderAgeModal(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">性別と年齢</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* Gender Selection */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">性別</h4>
              <div className="space-y-3">
                {["男性", "女性", "その他"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGender === gender ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}
                    >
                      {selectedGender === gender && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-gray-800">{gender}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Selection */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">年齢</h4>
              <div className="space-y-3">
                {["10代", "20代", "30代", "40代", "50代以上"].map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAge === age ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}
                    >
                      {selectedAge === age && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-gray-800">{age}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSaveGenderAge}
              disabled={isUpdating || !selectedGender || !selectedAge}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
            >
              {isUpdating ? "保存中..." : "保存する"}
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  // プロフィール編集画面（データベースから取得した値を表示）
  if (showProfileEdit) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowProfileEdit(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold flex-1 text-center">プロフィール</h1>
          <div className="w-10"></div>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* Profile Icon with Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={profileImagePreview || userProfile?.avatar_url || "/images/misecle-mascot.png"}
                  alt="Profile Icon"
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
                />
                
                {/* 選択された画像の削除ボタン */}
                {selectedProfileImage && (
                  <button
                    type="button"
                    onClick={handleProfileImageRemove}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* 画像情報表示 */}
              {selectedProfileImage && (
                <div className="text-center space-y-1 mb-2">
                  <p className="text-xs text-gray-600">{selectedProfileImage.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedProfileImage.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              )}

              {/* アップロード進行状況 */}
              {isUploadingProfile && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>アップロード中...</span>
                    <span>{Math.round(profileUploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileUploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 画像アップロードボタン */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="profile-image-upload"
                  onChange={handleProfileImageSelect}
                />
                <label
                  htmlFor="profile-image-upload"
                  className="text-blue-600 hover:text-blue-700 transition-colors text-sm cursor-pointer"
                >
                  写真を設定
                </label>
              </div>
            </div>

            {/* Name - データベースから取得した値を表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder={userProfile?.name || "名前を入力してください"}
              />
            </div>
            
            {/* Username - データベースから取得した値を表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーネーム</label>
              <input
                type="text"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder={userProfile?.username || "ユーザーネームを入力してください"}
              />
            </div>

            {/* Gender and Age - データベースから取得した値を表示 */}
            <div>
              <button
                onClick={handleOpenGenderAgeModal}
                className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800">性別と年齢</p>
                  <p className="text-sm text-gray-500">
                    {userProfile?.gender && userProfile?.age 
                      ? `${userProfile.gender} • ${userProfile.age}`
                      : "未設定 - 公開プロフィールには表示されません"
                    }
                  </p>
                </div>
                <span className="text-black">＞</span>
              </button>
            </div>

            {/* プロフィール作成日時の表示 */}
            {userProfile?.created_at && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  アカウント作成日: {new Date(userProfile.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button 
              onClick={handleSaveProfile}
              disabled={isUpdating || isUploadingProfile || !editedName.trim() || !editedUsername.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
            >
              {isUpdating ? "保存中..." : isUploadingProfile ? "アップロード中..." : "保存する"}
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showLogoutConfirmation) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowLogoutConfirmation(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">ログアウト</h1>
        </div>

        {/* Updated Logout Confirmation Content */}
        <div className="px-6 py-4 space-y-6">
          <div className="text-center space-y-6">
            <p className="text-lg text-gray-800">アカウントをログアウトしますか？</p>
            <Button
              onClick={confirmLogout}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-bold"
            >
              ログアウトする
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showNotificationBroadcast) {
    const handleSendNotification = async () => {
      if (!notificationTitle.trim() || !notificationBody.trim()) {
        alert("タイトルと本文を入力してください")
        return
      }

      setIsSending(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add the sent notification to the list
      const newNotification = {
        id: Date.now(),
        title: notificationTitle,
        message: notificationBody,
        date: new Date().toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        read: false,
      }
      setSentNotifications((prev) => [newNotification, ...prev])

      alert(`お知らせ「${notificationTitle}」をユーザー全員に配信しました！`)
      setNotificationTitle("")
      setNotificationBody("")
      setIsSending(false)
      setShowNotificationBroadcast(false)
    }

    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowNotificationBroadcast(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">お知らせ配信</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タイトル（30文字以内）</label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value.slice(0, 30))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="例：新機能リリースのお知らせ"
              />
              <div className="text-right text-xs text-gray-500 mt-1">{notificationTitle.length}/30文字</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">本文（200文字以内）</label>
              <textarea
                rows={6}
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value.slice(0, 200))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="配信内容を入力してください"
              />
              <div className="text-right text-xs text-gray-500 mt-1">{notificationBody.length}/200文字</div>
            </div>

            <Button
              onClick={handleSendNotification}
              disabled={isSending || !notificationTitle.trim() || !notificationBody.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
            >
              {isSending ? "配信中..." : "配信する"}
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showManagementScreen) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowManagementScreen(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">管理画面</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="font-semibold text-blue-800 mb-2">店舗管理者の方へ</h2>
              <p className="text-sm text-blue-700">
                Instagramから取り込まれた動画と店舗情報を紐付けることで、お客様からの予約を受け付けることができます。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">未設定の動画一覧</h3>
              <div className="space-y-4">
                {mockUnlinkedVideos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex gap-6">
                      <div className="relative flex-shrink-0 w-32">
                        <div className="aspect-[9/16] relative">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt="動画サムネイル"
                            className="w-full h-full rounded object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
                            <div className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">動画ID: {video.videoId}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.caption}</p>

                        {/* Action Buttons */}
                        <div className="space-y-3 mb-4">
                          <Button onClick={() => setSelectedVideo(video)} variant="outline" className="w-full py-2">
                            メールアドレスを設定
                          </Button>
                          <Button
                            onClick={() => setShowStoreDetails(showStoreDetails === video.id ? null : video.id)}
                            variant="outline"
                            className="w-full py-2"
                          >
                            {showStoreDetails === video.id ? "店舗情報を隠す" : "店舗情報を見る"}
                          </Button>
                        </div>

                        {/* Store Details - Show when expanded */}
                        {showStoreDetails === video.id && (
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-sm mb-3 text-gray-800">店舗情報</h4>
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">店舗名</p>
                                    <p className="text-gray-600">{video.extractedInfo.storeName}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">電話番号</p>
                                    <p className="text-gray-600">{video.extractedInfo.phoneNumber}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">住所</p>
                                  <p className="text-gray-600">{video.extractedInfo.address}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">営業時間</p>
                                    <p className="text-gray-600">{video.extractedInfo.businessHours}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">決済方法</p>
                                    <p className="text-gray-600">{video.extractedInfo.paymentMethods}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">アクセス</p>
                                  <p className="text-gray-600">{video.extractedInfo.access}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-medium text-sm mb-3 text-blue-800">紹介インフルエンサー</h4>
                              <div className="space-y-2 text-sm">
                                <p className="font-medium text-blue-700">{video.influencer.name}</p>
                                <p className="text-gray-700 italic">"{video.influencer.impression}"</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Email Setting Form - Show when selected */}
                        {selectedVideo?.id === video.id && (
                          <div className="space-y-4 mt-4 p-4 bg-yellow-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                店舗のメールアドレス
                              </label>
                              <input
                                type="email"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="store@example.com"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleLinkVideo(video)}
                                disabled={isLinking}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                              >
                                {isLinking ? "紐付け中..." : "紐付ける"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedVideo(null)
                                  setEmailAddress("")
                                }}
                                className="px-6 py-2"
                              >
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {mockUnlinkedVideos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">未設定の動画はありません</p>
                  <p className="text-xs text-gray-400">すべての動画が店舗と紐付けられています</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showReviews) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowReviews(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">レビューとコメント</h1>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4">
            {visitHistory.map((visit) => (
              <div key={visit.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                <img
                  src={visit.image || "/placeholder.svg"}
                  alt={visit.restaurantName}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm">{visit.restaurantName}</h4>
                    <span className="text-xs text-gray-500">{visit.date}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(visit.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">{visit.rating}</span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">{visit.review}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">レビュー投稿済み</span>
                    <button className="text-xs text-gray-500 hover:text-gray-700">編集</button>
                  </div>
                </div>
              </div>
            ))}

            {visitHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">まだレビューを投稿していません</p>
                <p className="text-xs text-gray-400">来店した店舗にレビューを投稿してみましょう</p>
              </div>
            )}
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showNotifications) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setShowNotifications(false)} className="text-black">
              ＜
            </Button>
            <h1 className="text-xl font-semibold">Misecleからのお知らせ</h1>
          </div>
        </div>

        <div className="px-6 py-4 bg-white">
          <div className="space-y-0">
            {sentNotifications.length > 0 ? (
              sentNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div className={`p-4 ${!notification.read ? "bg-blue-50/30" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        <span className="text-xs text-gray-500">{notification.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                  {index < sentNotifications.length - 1 && <div className="border-b border-gray-200 mx-4"></div>}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">配信されたお知らせはありません</p>
                <p className="text-xs text-gray-400">お知らせ配信機能を使って通知を送信してください</p>
              </div>
            )}
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showVisitedStores) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowVisitedStores(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">これまで来店した店舗一覧</h1>
        </div>

        <div className="px-6 py-4">
          {/* Updated visitHistory mapping and conditional rendering */}
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">これまで来店した店舗はありません</p>
            <p className="text-xs text-gray-400">来店後に店舗名が表示されます</p>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showAccountSettings) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowAccountSettings(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">アカウント設定</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">パスワード再設定</h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">現在のパスワード</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="現在のパスワードを入力してください"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新しいパスワード</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="新しいパスワードを入力してください（6文字以上）"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">新しいパスワードをもう一度入力</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="新しいパスワードをもう一度入力してください"
                  minLength={6}
                  required
                />
              </div>

              {/* パスワード要件の表示 */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-1">パスワード要件:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-700' : ''}`}>
                    <span className={newPassword.length >= 6 ? '✓' : '•'}>6文字以上</span>
                  </li>
                  <li className={`flex items-center gap-2 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-green-700' : ''}`}>
                    <span className={newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '•'}>確認パスワードと一致</span>
                  </li>
                  <li className={`flex items-center gap-2 ${newPassword && currentPassword && newPassword !== currentPassword ? 'text-green-700' : ''}`}>
                    <span className={newPassword && currentPassword && newPassword !== currentPassword ? '✓' : '•'}>現在のパスワードと異なる</span>
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? "変更中..." : "パスワードを変更する"}
              </Button>
            </form>

            <div className="border-t pt-4">
              <button
                onClick={handleForgotPassword}
                className="text-orange-600 text-sm hover:text-orange-700 transition-colors underline"
              >
                パスワードを忘れた場合はこちら
              </button>
              <p className="text-xs text-gray-500 mt-2">
                パスワードリセット用のメールが送信されます
              </p>

              {resetEmailSent && (
                <div className="mt-3 bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm">
                  パスワードリセット用のメールを
                  {resetEmailAddress ? `「${resetEmailAddress}」` : "登録メールアドレス"}
                  に送信しました。メール内のリンクから再設定を完了してください。
                </div>
              )}
            </div>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

          

  if (showLocationSettings) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowLocationSettings(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">位置情報の設定</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">ミセクルでの位置情報の取得を許可</h2>
            <p className="text-sm text-gray-600">
              ミセクルアプリでの位置情報の取得を行うには、位置情報アプリの取得を許可してください
            </p>
            <button className="text-blue-600 hover:text-blue-700 transition-colors">位置情報の取得を許可する</button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showPushNotificationSettings) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowPushNotificationSettings(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">プッシュ通知設定</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              ミセクルからの通知を受け取りたくない場合には、端末の通知の設定から、ミセクルアプリの通知をオフにしてください。
            </p>
            <button className="text-blue-600 hover:text-blue-700 transition-colors">通知設定を開く</button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showMutedStoresSettings) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowMutedStoresSettings(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">ミュートにしている店舗</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">ミュートにしている店舗はありません</h2>
            <p className="text-sm text-gray-600">
              ミュートした店舗からは通知が届かなくなり、クーポン情報や取得したクーポンなどの利用もできなくなります。
            </p>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showEmailSettings) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowEmailSettings(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">お知らせメール設定</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              登録すると期間限定のキャンペーン情報やお得なクーポン情報など、ミセクルのサービスに関する案内などをメールで受け取ることができます。
            </p>

            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <p className="text-gray-800 font-medium">登録中のメールアドレス</p>
              <p className="text-gray-600">未登録</p>
            </div>

            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              お知らせが配信されることに同意してメールアドレスを登録
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showContactForm) {
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      
      if (files.length === 0) return

      // 既存の画像と合わせて最大5枚まで
      const totalImages = selectedImages.length + files.length
      if (totalImages > 5) {
        toast({
          title: "画像数制限",
          description: "画像は最大5枚まで添付できます。",
          variant: "destructive",
        })
        return
      }

      // ファイルサイズと形式チェック
      const validFiles: File[] = []
      const errors: string[] = []

      files.forEach((file) => {
        // ファイルサイズチェック（5MB）
        if (file.size > 5 * 1024 * 1024) {
          errors.push(`${file.name}: ファイルサイズが5MBを超えています`)
          return
        }

        // ファイル形式チェック
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: サポートされていないファイル形式です`)
          return
        }

        validFiles.push(file)
      })

      if (errors.length > 0) {
        toast({
          title: "ファイルエラー",
          description: errors.join('\n'),
          variant: "destructive",
        })
      }

      if (validFiles.length === 0) return

      // 既存の画像に新しい画像を追加
      setSelectedImages(prev => [...prev, ...validFiles])
      
      // プレビュー画像を生成
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setImagePreviews(prev => [...prev, result])
        }
        reader.readAsDataURL(file)
      })

      // 入力フィールドをリセット
      e.target.value = ''
    }

    // 特定の画像を削除
    const handleImageRemove = (index: number) => {
      setSelectedImages(prev => prev.filter((_, i) => i !== index))
      setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    // 全画像をクリア
    const handleClearAllImages = () => {
      setSelectedImages([])
      setImagePreviews([])
      const fileInput = document.getElementById('image-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    }

    // 画像をBase64に変換
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = error => reject(error)
      })
    }

    // 画像圧縮関数（オプション）
    const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // アスペクト比を保持してリサイズ
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          }, file.type, quality)
        }
        
        img.src = URL.createObjectURL(file)
      })
    }

    async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      if (contactSending) return
      
      const formEl = e.currentTarget
      setContactSending(true)
      setUploadProgress(0)
      
      try {
        const form = new FormData(formEl)
        const name = (form.get("name") as string) || ""
        const email = (form.get("email") as string) || ""
        const category = (form.get("category") as string) || ""
        const message = (form.get("message") as string) || ""
        
        // 画像データの準備
        let imageDataArray: Array<{
          filename: string
          content: string
          type: string
        }> = []

        if (selectedImages.length > 0) {
          setUploadProgress(10)
          
          try {
            for (let i = 0; i < selectedImages.length; i++) {
              const file = selectedImages[i]
              
              // 必要に応じて画像を圧縮
              const processedFile = file.size > 2 * 1024 * 1024 
                ? await compressImage(file) 
                : file
              
              const base64Content = await fileToBase64(processedFile)
              imageDataArray.push({
                filename: processedFile.name,
                content: base64Content,
                type: processedFile.type
              })
              
              // プログレス更新
              setUploadProgress(10 + (i + 1) / selectedImages.length * 40)
            }
          } catch (error) {
            console.error("Failed to process images:", error)
            toast({
              title: "画像処理エラー",
              description: "画像の処理中にエラーが発生しました。画像なしで送信するか、別の画像を選択してください。",
              variant: "destructive",
            })
            setContactSending(false)
            setUploadProgress(0)
            return
          }
        }
        
        setUploadProgress(60)
        
        console.log("Sending contact form:", { 
          name, 
          email, 
          category, 
          message, 
          imageCount: imageDataArray.length 
        })
        
        const res = await sendSupportInquiryAction({ 
          name, 
          email, 
          category, 
          message,
          imageDataArray: imageDataArray.length > 0 ? imageDataArray : undefined
        })
        
        setUploadProgress(100)
        
        if (res.success) {
          formEl.reset()
          handleClearAllImages() // 画像もクリア
          showEmailSuccessMessage(
            "contact",
            `お問い合わせを正常に送信いたしました。${imageDataArray.length > 0 ? `${imageDataArray.length}枚の画像も添付されました。` : ''}内容を確認次第、ご登録いただいたメールアドレスにご連絡いたします。`
          )
        } else {
          toast({
            title: "送信失敗",
            description: res.error || "エラーが発生しました。",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Contact form error:", error)
        toast({
          title: "送信失敗",
          description: "予期しないエラーが発生しました。",
          variant: "destructive",
        })
      } finally {
        setContactSending(false)
        setUploadProgress(0)
      }
    }
      
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowContactForm(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">お問い合わせフォーム</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <form
            onSubmit={handleContactSubmit}
            className="space-y-4"
          >
            {/* 既存のフォームフィールド */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">お名前</label>
              <input
                name="name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="お名前を入力してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input
                name="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="メールアドレスを入力してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ種別</label>
              <select 
                name="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">選択してください</option>
                <option value="bug">アプリの不具合</option>
                <option value="store">店舗情報について</option>
                <option value="usage">使い方がわからない</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容</label>
              <textarea
                name="message"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="お問い合わせ内容を詳しくご記入ください"
                required
              />
              <p className="text-xs text-gray-500 mt-2">※ お問い合わせは support@newce.co.jp に送信されます</p>
            </div>

            {/* 改良された画像アップロード部分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像を添付 ({selectedImages.length}/5)
              </label>
              
              <div className="space-y-4">
                {/* アップロードエリア */}
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    id="image-upload"
                    onChange={handleImageSelect}
                    disabled={selectedImages.length >= 5}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                      selectedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {selectedImages.length >= 5 ? '画像を追加（上限到達）' : '画像を追加'}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF, WebP形式（各ファイル最大5MB、最大5枚まで）
                  </p>
                </div>

                {/* 画像プレビューエリア */}
                {selectedImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        選択された画像 ({selectedImages.length}枚)
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllImages}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        すべて削除
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                            <img
                              src={preview}
                              alt={`プレビュー ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* 画像情報オーバーレイ */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-md">
                            <p className="text-xs truncate">{selectedImages[index]?.name}</p>
                            <p className="text-xs">
                              {(selectedImages[index]?.size / 1024 / 1024).toFixed(2)}MB
                            </p>
                          </div>
                          
                          {/* 削除ボタン */}
                          <button
                            type="button"
                            onClick={() => handleImageRemove(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* アップロード進行状況 */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>アップロード中...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={contactSending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold disabled:bg-gray-300"
            >
              {contactSending ? 
                uploadProgress > 0 ? `アップロード中... ${Math.round(uploadProgress)}%` : "送信中..." 
                : "送信する"
              }
            </Button>
          </form>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showBugReportForm) {
    async function handleBugSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      if (bugSending) return
      const formEl = e.currentTarget
      setBugSending(true)
      try {
        const form = new FormData(formEl)
        const message = (form.get("bugMessage") as string) || ""
        console.log("Sending bug report:", { message })
        const res = await sendBugReportAction({ message })
        console.log("Bug report response:", res.success)
        if (res.success) {
          formEl.reset()
          console.log("Bug report sent successfully")
          showEmailSuccessMessage(
            "bug",
            "不具合・改善要望を正常に送信いたしました。開発チームが内容を確認し、アプリの改善に活用させていただきます。"
          )
        } else {
          toast({
            title: "送信失敗",
            description: res.error || "エラーが発生しました。",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Bug report error:", error)
        toast({
          title: "送信失敗",
          description: "予期しないエラーが発生しました。",
          variant: "destructive",
        })  
      } finally {
        setBugSending(false)
      }
    }

    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowBugReportForm(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-2xl font-semibold">Misecle不具合・改善要望報告フォーム</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              アプリの使い方に関しては
              <button
                onClick={() => {
                  setShowBugReportForm(false)
                  setShowFAQ(true)
                }}
                className="text-blue-600 hover:text-blue-700 underline mx-1"
              >
                よくある質問
              </button>
              をご確認ください。
            </p>

            <form
              onSubmit={handleBugSubmit}
              className="space-y-4"
            >
              <div className="bg-gray-200 p-6 rounded-lg">
                <div className="bg-white rounded-md">
                  <textarea
                    name="bugMessage"
                    rows={8}
                    className="w-full px-4 py-3 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="こちらにご記入ください..."
                    required
                  />
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                アプリについてのご意見・ご要望・不具合報告などをお送りください。お問い合わせいただいた内容は、開発チームが確認いたします。
              </p>

              <p className="text-xs text-gray-500 mb-2">※ 不具合・改善要望は support@newce.co.jp に送信されます</p>

              <Button
                type="submit"
                disabled={bugSending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
              >
                {bugSending ? "送信中..." : "メッセージの送信"}
              </Button>
            </form>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showFAQ) {
    const faqData = [
      {
        question: "Q1.Misecle（ミセクル）ってどんなサービスですか？",
        answer:
          "A1.ショート動画型のグルメ予約サービスです。ショート動画で、お店の雰囲気や料理のメニューなどを確認し、行きたい飲食店とマッチングできるサービスです。",
      },
      {
        question: "Q2.どうやってお店を探せますか？",
        answer: "A2.店舗名検索やショート動画で直感的に探せます。ジャンルや場所での絞り込み検索も可能です。",
      },
      {
        question: "Q3.予約は無料ですか？",
        answer: "A3.はい。アプリ内の予約は無料です。キャンセルもアプリ上から簡単に行えます。",
      },
      {
        question: "Q4.誰でも利用できますか？",
        answer:
          "A4.はい。大学生などZ世代を中心にどなたでもご利用いただけます。今後、一部キャンペーンや招待制機能なども追加予定です。",
      },
      {
        question: "Q5.アプリの利用に会員登録は必要ですか？",
        answer: "A5.はい。無料で新規登録できます。",
      },
      {
        question: "Q6.まだ利用できない機能はありますか？",
        answer:
          "A6.一部機能やポイント機能、お店からのプッシュ通知機能などはまだ未対応です。今後のアップデートで随時追加予定です。",
      },
      {
        question: "Q7.友達と一緒に予約できますか？",
        answer: "A7.はい、予約画面で人数を入力して一緒に予約が可能です。共有リンクで友達にも通知できます。",
      },
      {
        question: "Q8.支払い方法は何がありますか？",
        answer:
          "A8.現在は、店舗での現金・クレジットカード、電子マネー決済などが中心です。アプリ内決済などは今後対応予定です。",
      },
      {
        question: "Q9.店舗情報はどれぐらい正確ですか？",
        answer:
          "A9.現在は、一部情報が中心です。ショート動画による店舗紹介動画で「お店の雰囲気や料理の臨場感」がわかるほか、営業時間など基本的な情報も記載しています。",
      },
      {
        question: "Q10.アプリの不具合や問題があった場合などにはどのようにすれば良いですか？",
        answer:
          "A10.アプリ内の「マイページ」のところの「お問い合わせ」からご連絡ください。サポートチームが順次対応いたします。",
      },
    ]

    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowFAQ(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">Misecle よくある質問（FAQ）</h1>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-0">
            {faqData.map((faq, index) => (
              <div key={index}>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
                {index < faqData.length - 1 && <div className="border-b border-gray-200 mx-4"></div>}
              </div>
            ))}
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  // Add the gender/age modal before the showProfileEdit condition
  if (showGenderAgeModal) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowGenderAgeModal(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">性別と年齢</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* Gender Selection */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">性別</h4>
              <div className="space-y-3">
                {["男性", "女性", "その他"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGender === gender ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}
                    >
                      {selectedGender === gender && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-gray-800">{gender}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Selection */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">年齢</h4>
              <div className="space-y-3">
                {["10代", "20代", "30代", "40代", "50代以上"].map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAge === age ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}
                    >
                      {selectedAge === age && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-gray-800">{age}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={() => {
                // Here you would save the selections
                console.log("Selected gender:", selectedGender)
                console.log("Selected age:", selectedAge)
                setShowGenderAgeModal(false)
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            >
              保存する
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showProfileEdit) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowProfileEdit(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold flex-1 text-center">プロフィール</h1>
          <div className="w-10"></div>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-6">
            {/* Profile Icon */}
            <div className="text-center">
              <img
                src="/images/misecle-mascot.png"
                alt="Misecle Mascot"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-2"
              />
              <button className="text-blue-600 hover:text-blue-700 transition-colors text-sm">写真を設定</button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
              <input
                type="text"
                defaultValue="ミセクルユーザー"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="名前を入力してください"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーネーム</label>
              <input
                type="text"
                defaultValue="Misecle-Users"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="ユーザーネームを入力してください"
              />
            </div>

            {/* Gender and Age */}
            <div>
              <button
                onClick={() => setShowGenderAgeModal(true)}
                className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-gray-800">性別と年齢</p>
                  <p className="text-sm text-gray-500">公開プロフィールには表示されません</p>
                </div>
                <span className="text-black">＞</span>
              </button>
            </div>

            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold">
              保存する
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showProfileDetails) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowProfileDetails(false)
              setShowAccountSettings(true)
            }}
            className="text-black"
          >
            ＜
          </Button>
          <h1 className="text-xl font-semibold">あなたのプロフィール</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="田中"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">名</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="太郎"
                />
              </div>
            </div>

            {/* Kana Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">セイ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="タナカ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メイ</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="タロウ"
                />
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生年月日</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">性別</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="male"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="male" className="text-sm text-gray-700">
                    男性
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="female"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="female" className="text-sm text-gray-700">
                    女性
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="other"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="other" className="text-sm text-gray-700">
                    その他
                  </label>
                </div>
              </div>
            </div>

            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold">
              保存する
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showOtherProfile) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowOtherProfile(false)
              setShowAccountSettings(true)
            }}
            className="text-black"
          >
            ＜
          </Button>
          <h1 className="text-xl font-semibold">その他のプロフィール</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="space-y-4">
            {/* Privacy Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                ここで入力した内容は外部には公開されず、サービスの改善にのみ使用します。
              </p>
            </div>

            {/* Occupation */}
            <div>
              <button
                onClick={() => setExpandedOccupation(!expandedOccupation)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-700">所属</span>
                <span className="text-black">{expandedOccupation ? "−" : "＞"}</span>
              </button>

              {expandedOccupation && (
                <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="highschool"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="highschool" className="text-sm text-gray-700">
                      高校生
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="vocational"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="vocational" className="text-sm text-gray-700">
                      専門学生
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="university"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="university" className="text-sm text-gray-700">
                      大学生・大学院生
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="parttime"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="parttime" className="text-sm text-gray-700">
                      パート・アルバイト
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="fulltime"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="fulltime" className="text-sm text-gray-700">
                      会社員（正社員）
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="contract"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="contract" className="text-sm text-gray-700">
                      会社員（契約社員/派遣社員）
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="selfemployed"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="selfemployed" className="text-sm text-gray-700">
                      自営業・フリーランス
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="housewife"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="housewife" className="text-sm text-gray-700">
                      専業主婦・主夫
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="unemployed"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="unemployed" className="text-sm text-gray-700">
                      無職
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="notapplicable"
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="notapplicable" className="text-sm text-gray-700">
                      該当なし
                    </label>
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold">
              保存する
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  if (showUploadModal) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowUploadModal(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">コンテンツをアップロード</h1>
        </div>
        <div className="px-6 py-4">
          <VideoUploader />
        </div>
        <Navigation />
      </div>
    )
  }

  if (showMyVideosModal) {    
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowMyVideosModal(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">自分の動画</h1>
        </div>
        <div className="px-6 py-4">
          <MyVideosPanel />
        </div>
        <Navigation />
      </div>
    )
  }

  // Stats Page (Followers/Following/Posts)
  if (showFollowers || showFollowing || showPosts) {
    const mockFollowers = [
      {
        id: 1,
        name: "田中花子",
        username: "@hanako_tanaka",
        avatar: "/placeholder.svg?height=40&width=40",
        isFollowing: true,
      },
      {
        id: 2,
        name: "佐藤太郎",
        username: "@taro_sato",
        avatar: "/placeholder.svg?height=40&width=40",
        isFollowing: false,
      },
      {
        id: 3,
        name: "山田美咲",
        username: "@misaki_yamada",
        avatar: "/placeholder.svg?height=40&width=40",
        isFollowing: true,
      },
      {
        id: 4,
        name: "鈴木健太",
        username: "@kenta_suzuki",
        avatar: "/placeholder.svg?height=40&width=40",
        isFollowing: false,
      },
    ]

    const mockFollowing = [
      {
        id: 1,
        type: "user",
        name: "グルメ太郎",
        username: "@gourmet_taro",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        type: "restaurant",
        name: "カフェ・ド・パリ",
        username: "@cafe_de_paris",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        type: "user",
        name: "料理好き花子",
        username: "@cooking_hanako",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        type: "restaurant",
        name: "焼肉 炭火亭",
        username: "@yakiniku_sumibiya",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ]

    const mockPosts = [
      {
        id: 1,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "美味しい焼き鳥",
        views: "1.2k",
        likes: "89",
        date: "2024年1月15日",
      },
      {
        id: 2,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "カフェのパンケーキ",
        views: "856",
        likes: "67",
        date: "2024年1月12日",
      },
      {
        id: 3,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "ラーメンの作り方",
        views: "2.1k",
        likes: "134",
        date: "2024年1月10日",
      },
      {
        id: 4,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "寿司職人の技",
        views: "3.4k",
        likes: "256",
        date: "2024年1月8日",
      },
      {
        id: 5,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "イタリアンパスタ",
        views: "945",
        likes: "78",
        date: "2024年1月5日",
      },
      {
        id: 6,
        thumbnail: "/placeholder.svg?height=120&width=120",
        title: "デザート作り",
        views: "1.8k",
        likes: "123",
        date: "2024年1月3日",
      },
    ]

    return (
      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowFollowers(false)
              setShowFollowing(false)
              setShowPosts(false)
            }}
            className="text-black"
          >
            ＜
          </Button>
          <h1 className="text-xl font-semibold">Misecle-Users</h1>
        </div>

        {/* Stats Tabs */}
        <div className="px-6">
          <div className="flex">
            <button
              onClick={() => setSelectedStatsTab("followers")}
              className={`flex-1 text-center py-3 relative ${
                selectedStatsTab === "followers" ? "text-black" : "text-gray-600"
              }`}
            >
              <span className="font-medium">フォロワー</span>
              <span className="ml-2 text-sm">128</span>
              {selectedStatsTab === "followers" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              )}
            </button>
            <button
              onClick={() => setSelectedStatsTab("following")}
              className={`flex-1 text-center py-3 relative ${
                selectedStatsTab === "following" ? "text-black" : "text-gray-600"
              }`}
            >
              <span className="font-medium">フォロー中</span>
              <span className="ml-2 text-sm">56</span>
              {selectedStatsTab === "following" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              )}
            </button>
            <button
              onClick={() => setSelectedStatsTab("posts")}
              className={`flex-1 text-center py-3 relative ${
                selectedStatsTab === "posts" ? "text-black" : "text-gray-600"
              }`}
            >
              <span className="font-medium">投稿数</span>
              <span className="ml-2 text-sm">{mockUserStats.totalReviews}</span>
              {selectedStatsTab === "posts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {selectedStatsTab === "followers" && (
            <div className="space-y-4">
              {mockFollowers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {follower.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{follower.name}</h4>
                      <p className="text-xs text-gray-500">{follower.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={follower.isFollowing ? "outline" : "default"}
                    className={follower.isFollowing ? "bg-transparent" : "bg-orange-600 hover:bg-orange-700 text-white"}
                  >
                    {follower.isFollowing ? "フォロー中" : "フォローする"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedStatsTab === "following" && (
            <div className="space-y-4">
              {mockFollowing.map((following) => (
                <div key={following.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {following.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{following.name}</h4>
                      <p className="text-xs text-gray-500">{following.username}</p>
                      <p className="text-xs text-orange-600">{following.type === "restaurant" ? "店舗" : "ユーザー"}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent">
                    フォロー中
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selectedStatsTab === "posts" && (
            <div className="grid grid-cols-3 gap-2">
              {mockPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <video src="/placeholder-video.mp4" className="w-full h-full object-cover" muted loop playsInline />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium line-clamp-2 mb-1">{post.title}</p>
                    <div className="flex items-center justify-between text-white text-xs">
                      <span>{post.views} 回再生</span>
                      <span>♡ {post.likes}</span>
                    </div>
                  </div>
                  {/* Play icon overlay */}
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Navigation />
      </div>
    )
  }

  // Add the notification permission modal after the other conditional renders
  if (showNotificationPermission) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowNotificationPermission(false)} className="text-black">
            ＜
          </Button>
          <h1 className="text-xl font-semibold">通知設定</h1>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-orange-600" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-800">ミセクルからのお知らせを許可しますか？</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                新しい店舗情報、お得なクーポン、予約確認などの重要な通知をお送りします。 いつでも設定から変更できます。
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Here you would typically request notification permission
                  // navigator.serviceWorker.ready.then(registration => {
                  //   return registration.pushManager.subscribe({...})
                  // })
                  alert("通知を許可しました！")
                  setShowNotificationPermission(false)
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
              >
                許可する
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  alert("通知を許可しませんでした。後で設定から変更できます。")
                  setShowNotificationPermission(false)
                }}
                className="w-full py-3 text-lg font-semibold"
              >
                後で決める
              </Button>
            </div>

            <p className="text-xs text-gray-500">※ 端末の設定からも通知のオン・オフを変更できます</p>
          </div>
        </div>

        <Navigation />
      </div>
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
        {/* User Profile Card - データベースから取得した情報を表示 */}
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

        {/* Menu Items */}
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
