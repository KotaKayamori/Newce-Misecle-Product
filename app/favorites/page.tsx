"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VideoFullscreenOverlay from "@/components/VideoFullscreenOverlay"
import AlbumViewerOverlay from "../../components/AlbumViewerOverlay"
import { LikedVideosSection } from "./components/LikedVideosSection"
import { SavedVideosSection } from "./components/SavedVideosSection"
import { LikedAlbumsSection } from "./components/LikedAlbumsSection"
import { SavedAlbumsSection } from "./components/SavedAlbumsSection"
import { ReservationModal } from "@/components/modals/ReservationModal"
import { StoreDetailModal } from "./components/StoreDetailModal"
import Navigation from "@/components/navigation"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FALLBACK_VIDEO_URL, derivePosterUrl } from "@/lib/media"
import { openReservationForVideo as openReserveShared, openStoreDetailForVideo as openStoreShared } from "@/lib/video-actions"
import type { AlbumRow, FavoriteVideo, ReservationFormData, RestaurantInfo } from "@/lib/types"
import { useFavoriteVideos } from "./hooks/useFavoriteVideos"
import { useFavoriteAlbums } from "./hooks/useFavoriteAlbums"

export default function FavoritesPage() {
  const router = useRouter()
  const {
    likedVideos,
    likesLoading,
    bookmarkedVideos,
    bookmarksLoading,
    bookmarksError,
    needLogin,
    likedSet,
    bookmarkedSet,
    ownerProfiles: videoOwnerProfiles,
    getLikeCount,
    toggleBookmarkForVideo,
    removeBookmark,
    handleToggleLikeInFeed,
  } = useFavoriteVideos()

  const {
    likedAlbums,
    savedAlbums,
    likedAlbumsLoading,
    savedAlbumsLoading,
    likedAlbumSet,
    bookmarkedAlbumSet,
    ownerProfiles: albumOwnerProfiles,
    toggleAlbumLike,
    toggleAlbumBookmark,
  } = useFavoriteAlbums()

  const [fsOpen, setFsOpen] = useState(false)
  const [fsVideo, setFsVideo] = useState<{ id: string; playback_url: string; poster_url?: string | null; title?: string | null; caption?: string | null } | null>(null)
  const [fsOwnerHandle, setFsOwnerHandle] = useState<string>("")
  const [fsOwnerAvatar, setFsOwnerAvatar] = useState<string | null | undefined>(null)
  const [fsOwnerUserId, setFsOwnerUserId] = useState<string | null | undefined>(null)
  const [fsMuted, setFsMuted] = useState(false)

  const [albumFsOpen, setAlbumFsOpen] = useState(false)
  const [albumFsAssets, setAlbumFsAssets] = useState<{ id: string; url: string; order: number; width?: number | null; height?: number | null }[]>([])
  const [albumFsIndex, setAlbumFsIndex] = useState(0)
  const [albumFsTitle, setAlbumFsTitle] = useState<string | null>(null)
  const [albumFsOwnerLabel, setAlbumFsOwnerLabel] = useState<string | null>(null)
  const [albumFsOwnerAvatar, setAlbumFsOwnerAvatar] = useState<string | null>(null)
  const [albumFsDescription, setAlbumFsDescription] = useState<string | null>(null)
  const [albumFsAlbumId, setAlbumFsAlbumId] = useState<string | null>(null)

  const openOverlayForLiked = (v: { id: string; owner_id: string; playback_url: string; title?: string | null; caption?: string | null }) => {
    const prof = videoOwnerProfiles[v.owner_id]
    const handle = prof?.username ? `@${prof.username}` : (prof?.display_name || "ユーザー")
    setFsVideo({ id: v.id, playback_url: v.playback_url || FALLBACK_VIDEO_URL, poster_url: derivePosterUrl(v.playback_url as any, (v as any).storage_path), title: v.title ?? null, caption: v.caption ?? null })
    setFsOwnerHandle(handle)
    setFsOwnerAvatar(prof?.avatar_url ?? null)
    setFsOwnerUserId(v.owner_id)
    setFsMuted(false)
    setFsOpen(true)
  }

  const openOverlayForBookmarked = (video: { id: string; owner_id: string; playback_url: string; title?: string | null; caption?: string | null }) => {
    const prof = videoOwnerProfiles[video.owner_id]
    const handle = prof?.username ? `@${prof.username}` : (prof?.display_name || "ユーザー")
    setFsVideo({ id: video.id, playback_url: video.playback_url || FALLBACK_VIDEO_URL, poster_url: derivePosterUrl(video.playback_url as any, (video as any).storage_path), title: video.title ?? null, caption: video.caption ?? null })
    setFsOwnerHandle(handle)
    setFsOwnerAvatar(prof?.avatar_url ?? null)
    setFsOwnerUserId(video.owner_id)
    setFsMuted(false)
    setFsOpen(true)
  }

  // ===== Albums: helpers and handlers =====

  const openAlbumOverlay = async (album: AlbumRow, startIndex = 0) => {
    try {
      setAlbumFsAlbumId(album.id)
      const profile = albumOwnerProfiles[album.owner_id]
      const handle = profile?.username ? `@${profile.username}` : (profile?.display_name || "ユーザー")
      setAlbumFsTitle(album.title ?? album.caption ?? "アルバム")
      setAlbumFsDescription(album.caption ?? null)
      setAlbumFsOwnerLabel(handle)
      setAlbumFsOwnerAvatar(profile?.avatar_url ?? null)
      const res = await fetch(`/api/guidebook/albums/${album.id}/assets`, { cache: "no-store" })
      const json = await res.json()
      const items = (json?.items ?? []).map((a: any) => ({ id: a.id, url: a.url, order: a.order, width: a.width, height: a.height }))
      setAlbumFsAssets(items)
      setAlbumFsIndex(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)))
      setAlbumFsOpen(true)
    } catch {}
  }

  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showStoreDetailModal, setShowStoreDetailModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantInfo | null>(null)
  // const [showUserProfile, setShowUserProfile] = useState(false) // TODO: 未使用
  // const [selectedUser, setSelectedUser] = useState(null) // TODO: 未使用
  const [reservationData, setReservationData] = useState<ReservationFormData>({
    name: "",
    people: 2,
    date: "",
    time: "18:00",
    seatType: "指定なし",
    message: "",
  })

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-6 py-4 text-center">
        <h1 className="text-xl font-semibold">お気に入り</h1>
      </div>

      <div className="px-6">
        <Tabs defaultValue="restaurants" className="w-full">
          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsList className="inline-flex w-max gap-3 bg-transparent h-auto p-0 border-0">
              <TabsTrigger
                value="restaurants"
                className="shrink-0 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                いいねした動画 ({likedVideos?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="shrink-0 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                保存した動画 ({bookmarkedVideos.length})
              </TabsTrigger>
              <TabsTrigger
                value="liked-albums"
                className="shrink-0 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                いいねしたアルバム ({likedAlbums?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="saved-albums"
                className="shrink-0 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none border-b-2 border-transparent pb-3 text-gray-600 py-2"
              >
                保存したアルバム ({savedAlbums.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="restaurants" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            <LikedVideosSection
              videos={likedVideos}
              likesLoading={likesLoading}
              needLogin={needLogin}
              ownerProfiles={videoOwnerProfiles}
              bookmarkedSet={bookmarkedSet}
              onToggleBookmark={toggleBookmarkForVideo}
              onVideoClick={(video) => openOverlayForLiked(video)}
              onLoginRequest={() => router.push("/auth/login")}
              onExploreVideos={() => router.push("/search")}
            />
          </TabsContent>

          <TabsContent value="videos" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            <SavedVideosSection
              videos={bookmarkedVideos}
              loading={bookmarksLoading}
              error={bookmarksError}
              needLogin={needLogin}
              ownerProfiles={videoOwnerProfiles}
              onLoginRequest={() => router.push("/auth/login")}
              onExploreVideos={() => router.push("/search")}
              onRemoveBookmark={removeBookmark}
              onVideoClick={(video) => openOverlayForBookmarked(video)}
            />
          </TabsContent>

          {/* いいねしたアルバム */}
          <TabsContent value="liked-albums" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            <LikedAlbumsSection
              albums={likedAlbums}
              loading={likedAlbumsLoading}
              needLogin={needLogin}
              ownerProfiles={albumOwnerProfiles}
              bookmarkedAlbumSet={bookmarkedAlbumSet}
              onAlbumClick={openAlbumOverlay}
              onToggleBookmark={toggleAlbumBookmark}
              onLoginRequest={() => router.push("/auth/login")}
              onExploreAlbums={() => router.push("/search")}
            />
          </TabsContent>

          {/* 保存したアルバム */}
          <TabsContent value="saved-albums" className="mt-4 bg-white overflow-y-auto scrollbar-hide">
            <SavedAlbumsSection
              albums={savedAlbums}
              loading={savedAlbumsLoading}
              needLogin={needLogin}
              ownerProfiles={albumOwnerProfiles}
              onAlbumClick={openAlbumOverlay}
              onToggleBookmark={toggleAlbumBookmark}
              onLoginRequest={() => router.push("/auth/login")}
              onExploreAlbums={() => router.push("/search")}
            />
          </TabsContent>

        </Tabs>
      </div>

      {/* Unified fullscreen overlay */}
      {fsOpen && fsVideo && (
        <VideoFullscreenOverlay
          open={fsOpen}
          video={fsVideo}
          ownerHandle={fsOwnerHandle}
          ownerAvatarUrl={fsOwnerAvatar ?? null}
          ownerUserId={fsOwnerUserId ?? null}
          // liked={likedSet.has(fsVideo.id)}
          // likeCount={getLikeCount(fsVideo.id)}
          // onToggleLike={() => handleToggleLikeInFeed(fsVideo.id)}
          bookmarked={bookmarkedSet.has(fsVideo.id)}
          onToggleBookmark={() => toggleBookmarkForVideo({ id: fsVideo.id } as any)}
          onShare={async () => { try { if ((navigator as any).share) { await (navigator as any).share({ url: fsVideo.playback_url }) } else { await navigator.clipboard.writeText(fsVideo.playback_url); alert("リンクをコピーしました") } } catch {} }}
          onClose={() => setFsOpen(false)}
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
          muted={fsMuted}
          onToggleMuted={() => setFsMuted((m) => !m)}
        />
      )}

      {/* Album fullscreen overlay */}
      {albumFsOpen && (
        <AlbumViewerOverlay
          open={albumFsOpen}
          assets={albumFsAssets}
          index={albumFsIndex}
          onClose={() => setAlbumFsOpen(false)}
          onIndexChange={(nextIndex) => {
            const clamped = Math.max(0, Math.min(nextIndex, albumFsAssets.length - 1))
            setAlbumFsIndex(clamped)
          }}
          title={albumFsTitle}
          ownerAvatarUrl={albumFsOwnerAvatar}
          ownerLabel={albumFsOwnerLabel ?? undefined}
          description={albumFsDescription ?? undefined}
          liked={albumFsAlbumId ? likedAlbumSet.has(albumFsAlbumId) : false}
          onToggleLike={() => albumFsAlbumId && toggleAlbumLike(albumFsAlbumId)}
          bookmarked={albumFsAlbumId ? bookmarkedAlbumSet.has(albumFsAlbumId) : false}
          onToggleBookmark={() => albumFsAlbumId && toggleAlbumBookmark(albumFsAlbumId)}
          onShare={async () => {
            const url = albumFsAssets[albumFsIndex]?.url
            if (!url) return
            try { if ((navigator as any).share) await (navigator as any).share({ url }); else { await navigator.clipboard.writeText(url); alert("リンクをコピーしました") } } catch {}
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

      <Navigation />
    </div>
  )
}
