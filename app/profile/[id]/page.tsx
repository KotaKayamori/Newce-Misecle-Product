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

// 動画の型定義
interface UserVideo {
  id: string
  owner_id: string
  playback_url: string
  storage_path: string
  title: string | null
  caption: string | null
  created_at: string
}

// アルバムの型定義
interface UserAlbum {
  id: string
  owner_id: string
  title: string | null
  description: string | null
  caption: string | null
  cover_path: string | null
  created_at: string
}

// ポスター URL を導出
function derivePosterUrl(playbackUrl?: string | null, storagePath?: string | null): string | null {
  const VIDEO_EXT_REGEX = /\.(mp4|mov|m4v|webm|ogg)$/i
  if (storagePath) {
    const posterPath = storagePath.replace(/\.[^.]+$/, ".webp")
    if (posterPath && posterPath !== storagePath) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
      if (base) {
        const objectPath = posterPath.replace(/^\/+/, "")
        return `${base}/storage/v1/object/public/videos/${objectPath}`
      }
    }
  }
  if (!playbackUrl) return null
  try {
    const url = new URL(playbackUrl)
    if (!VIDEO_EXT_REGEX.test(url.pathname)) return null
    url.pathname = url.pathname.replace(VIDEO_EXT_REGEX, ".webp")
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    const base = playbackUrl?.split?.("?")[0]
    if (base && VIDEO_EXT_REGEX.test(base)) {
      return base.replace(VIDEO_EXT_REGEX, ".webp")
    }
    return null
  }
}

// アルバムカバー URL を導出
function deriveAlbumCoverUrl(coverPath?: string | null): string | null {
  if (!coverPath) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return null
  const objectPath = coverPath.replace(/^\/+/, "")
  return `${base}/storage/v1/object/public/photos/${objectPath}`
}

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
          .select("id, owner_id, title, description, caption, cover_path, created_at")
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
      const { data, error } = await supabase
        .from("photo_assets")
        .select("id, storage_path, display_order, width, height")
        .eq("album_id", album.id)
        // .order("display_order", { ascending: true })
      
      if (error) throw error
      
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
      const assets: AlbumAsset[] = (data || []).map((asset: any) => ({
        id: asset.id,
        url: base ? `${base}/storage/v1/object/public/photos/${asset.storage_path}` : "",
        order: asset.display_order,
        width: asset.width,
        height: asset.height,
      }))
      
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
        />
      )}

      {/* Album Viewer Overlay */}
      {selectedAlbum && (
        <AlbumViewerOverlay
          open={albumViewerOpen}
          assets={albumAssets}
          index={albumAssetIndex}
          loading={albumAssetsLoading}
          onClose={() => setAlbumViewerOpen(false)}
          onIndexChange={setAlbumAssetIndex}
          title={selectedAlbum.title}
          ownerAvatarUrl={userProfile.avatar_url}
          ownerLabel={`@${userProfile.username || "user"}`}
          ownerUserId={userId}
        />
      )}

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
                <div className="font-bold text-lg">{videos.length}</div>
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