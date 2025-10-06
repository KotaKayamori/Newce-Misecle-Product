"use client"
import { useState } from "react"
import type React from "react"

import { Heart, Bookmark, Share, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Video {
  id: number
  restaurantId: number
  restaurantName: string
  videoUrl: string
  title: string
  description: string
  likes: number
  views: string
  user: {
    name: string
    avatar: string
  }
  genre: string
  distance: string
  rating: number
  favoriteDate: string
}

interface VideoFeedModalProps {
  videos: Video[]
  selectedVideoIndex: number
  onClose: () => void
}

export default function VideoFeedModal({ videos, selectedVideoIndex, onClose }: VideoFeedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedVideoIndex)
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set())
  const [savedVideos, setSavedVideos] = useState<Set<number>>(new Set())

  const currentVideo = videos[currentIndex]

  const handleLike = (videoId: number) => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const handleSave = (videoId: number) => {
    setSavedVideos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (!currentVideo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black" onWheel={handleScroll}>
      <div className="relative w-full h-full">
        {/* Video */}
        <video
          key={currentVideo.id}
          src={currentVideo.videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Right side buttons */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          <button onClick={() => handleLike(currentVideo.id)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Heart
                className={`w-6 h-6 ${likedVideos.has(currentVideo.id) ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </div>
            <span className="text-white text-xs">
              {currentVideo.likes > 1000 ? `${(currentVideo.likes / 1000).toFixed(1)}k` : currentVideo.likes}
            </span>
          </button>

          <button onClick={() => handleSave(currentVideo.id)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Bookmark
                className={`w-6 h-6 ${
                  savedVideos.has(currentVideo.id) ? "fill-yellow-500 text-yellow-500" : "text-white"
                }`}
              />
            </div>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Share className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 flex flex-col justify-end p-4 pb-32">
            <div className="text-white">
              <div className="mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                    <img
                      src={currentVideo.user.avatar || "/placeholder.svg"}
                      alt={currentVideo.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold">{currentVideo.user.name}</span>
                </div>
                <p className="text-sm mb-2">
                  {currentVideo.restaurantName}の美味しい{currentVideo.genre} ✨{"\n"}
                  新鮮な食材と職人の技が光る一品です！
                  {"\n"}#グルメ #{currentVideo.genre} #美味しい #おすすめ
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                  今すぐ予約する
                </button>
                <button className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  もっと見る…
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video navigation indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white bg-opacity-50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
