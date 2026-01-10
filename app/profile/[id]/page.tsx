"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, Play, Image } from "lucide-react"
import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { fetchUserProfile, UserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabase"
import { useFollow } from "@/hooks/useFollow"
import { useLike } from "@/hooks/useLike"
import { useBookmark } from "@/hooks/useBookmark"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import AlbumViewerOverlay, { AlbumAsset } from "@/components/AlbumViewerOverlay"
import type { UserVideo, UserAlbum } from "../types"
import type { RestaurantInfo, ReservationFormData } from "@/lib/types"
import { derivePosterUrl, deriveAlbumCoverUrl } from "@/lib/media"
import { openReservationForVideo as openReserveShared, openStoreDetailForVideo as openStoreShared } from "@/lib/video-actions"
import { ReservationModal } from "@/components/modals/ReservationModal"
import { StoreDetailModal } from "@/components/modals/StoreDetailModal"

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user } = useAuth()
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"video" | "album">("video")
  
  // フォロー機能
  const { 
    isFollowing, 
    loading: followLoading, 
    followersCount, 
    followingCount, 
    toggleFollow 
  } = useFollow(userId)

  // ブックマーク機能
  const { bookmarkedVideoIds, toggleBookmark } = useBookmark()

  // 動画関連
  const [videos, setVideos] = useState<UserVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(true)

  // 動画フルスクリーン関連
  const [fsOpen, setFsOpen] = useState(false)
  const [fsVideo, setFsVideo] = useState<{ id: string; playback_url: string; poster_url?: string | null; title?: string | null; caption?: string | null } | null>(null)
  const [fsOwnerHandle, setFsOwnerHandle] = useState<string>("")
  const [fsOwnerAvatar, setFsOwnerAvatar] = useState<string | null>(null)
  const [fsOwnerUserId, setFsOwnerUserId] = useState<string | null>(null)
  const [fsMuted, setFsMuted] = useState(false)
  
  // アルバム関連
  const [albums, setAlbums] = useState<UserAlbum[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(true)
  
  // アルバムビューア関連
  const [selectedAlbum, setSelectedAlbum] = useState<UserAlbum | null>(null)
  const [albumAssets, setAlbumAssets] = useState<AlbumAsset[]>([])
  const [albumViewerOpen, setAlbumViewerOpen] = useState(false)
  const [albumAssetIndex, setAlbumAssetIndex] = useState(0)
  const [albumAssetsLoading, setAlbumAssetsLoading] = useState(false)
  
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

  // 自分のプロフィールページの場合は /profile にリダイレクト
  useEffect(() => {
    if (user && user.id === userId) {
      router.replace("/profile")
    }
  }, [user, userId, router])

  // ユーザープロフィールを取得
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const profile = await fetchUserProfile(userId)
        setUserProfile(profile)
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err)
        if (err.message === 'PROFILE_NOT_FOUND') {
          setError("ユーザーが見つかりません")
        } else {
          setError(err.message || "プロフィールの取得に失敗しました")
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [userId])

  // ユーザーの動画を取得
  useEffect(() => {
    const loadVideos = async () => {
      if (!userId) return
      
      setVideosLoading(true)
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("id, owner_id, playback_url, storage_path, title, caption, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
        
        if (error) throw error
        setVideos(data || [])
      } catch (err: any) {
        console.error("Failed to fetch user videos:", err)
        setVideos([])
      } finally {
        setVideosLoading(false)
      }
    }
    
    loadVideos()
  }, [userId])

  // ユーザーのアルバムを取得
  useEffect(() => {
    const loadAlbums = async () => {
      if (!userId) return
      
      setAlbumsLoading(true)
      try {
        const { data, error } = await supabase
          .from("photo_albums")
          .select("id, owner_id, title, caption, cover_path, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
        
        if (error) throw error
        
        setAlbums(data || [])
      } catch (err: any) {
        console.error("Failed to fetch user albums:", err)
        setAlbums([])
      } finally {
        setAlbumsLoading(false)
      }
    }
    
    loadAlbums()
  }, [userId])

  // フォローボタンクリック
  const handleFollowClick = async () => {
    if (!user) {
      // 未ログインの場合はログインページへ
      router.push("/auth/login")
      return
    }
    await toggleFollow()
  }

  // 動画クリック時
  const handleVideoClick = (video: UserVideo) => {
    const handle = userProfile?.username 
      ? `@${userProfile.username}` 
      : "ユーザー"
    
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
    } catch (err: any) {
      console.error("Failed to fetch album assets:", err)
      setAlbumAssets([])
    } finally {
      setAlbumAssetsLoading(false)
    }
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

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="bg-white px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-base font-semibold">プロフィール</span>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="px-6 py-12">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{error || "ユーザーが見つかりません"}</p>
            <Button onClick={() => router.back()} variant="outline" className="border-gray-300">
              戻る
            </Button>
          </div>
        </div>

        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Video Fullscreen Overlay */}
      {fsOpen && fsVideo && (
        <VideoFullscreenOverlay
          open={fsOpen}
          video={fsVideo}
          ownerHandle={fsOwnerHandle}
          ownerAvatarUrl={fsOwnerAvatar}
          ownerUserId={fsOwnerUserId}
          muted={fsMuted}
          bookmarked={bookmarkedVideoIds.has(fsVideo.id)}
          onShare={async () => { try { if ((navigator as any).share) { await (navigator as any).share({ url: fsVideo.playback_url }) } else { await navigator.clipboard.writeText(fsVideo.playback_url); alert("リンクをコピーしました") } } catch {} }}
          onClose={() => setFsOpen(false)}
          onToggleMuted={() => setFsMuted((m) => !m)}
          onToggleBookmark={() => toggleBookmark(fsVideo.id)}
          onReserve={() => { openReserveShared({ setSelectedRestaurant, setShowReservationModal, setShowFullscreenVideo: setFsOpen as any }, { id: fsVideo.id, title: fsVideo.title as any } as any, { keepFullscreen: true }) }}
          onMore={() => {
            const videoForModal = {
              id: fsVideo.id,
              title: fsVideo.title as any,
              caption: fsVideo.caption as any,
              owner_label: fsOwnerHandle || null,
              owner_avatar_url: fsOwnerAvatar || null,
            }
            openStoreShared({ setSelectedRestaurant, setShowStoreDetailModal }, videoForModal as any, { keepFullscreen: true })
          }}
        />
      )}

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
          ownerAvatarUrl={userProfile.avatar_url}
          ownerLabel={`@${userProfile.username || "user"}`}
          ownerUserId={userId}
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

      <StoreDetailModal
        open={showStoreDetailModal}
        restaurant={selectedRestaurant}
        onClose={() => setShowStoreDetailModal(false)}
        onReserve={() => setShowReservationModal(true)}
      />

      {/* Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-base font-semibold">
            @{userProfile.username || "username"}
          </span>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-6 mb-4">
          <img
            src={userProfile.avatar_url || "/images/misecle-mascot.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
          />
          
          <div className="flex-1">
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

        {userProfile.profile && (
          <div className="mb-4">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {userProfile.profile}
            </p>
          </div>
        )}

        {userProfile.sns_link && (
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

        {/* フォローボタン */}
        <Button
          onClick={handleFollowClick}
          disabled={followLoading}
          variant={isFollowing ? "outline" : "default"}
          className={`w-full font-medium py-2 rounded-lg ${
            isFollowing 
              ? "border-gray-300 text-gray-800 hover:bg-gray-100" 
              : "bg-orange-600 hover:bg-orange-700 text-white"
          }`}
        >
          {followLoading ? "読み込み中..." : isFollowing ? "フォロー中" : "フォローする"}
        </Button>
      </div>

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
                  {/* 再生アイコン */}
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
                  {/* 複数枚アイコン */}
                  <div className="absolute top-2 right-2">
                    <Image className="w-5 h-5 text-white drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      <Navigation />
    </div>
  )
}
