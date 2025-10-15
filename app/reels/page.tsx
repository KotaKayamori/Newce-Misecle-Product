// import ReelsFeedLive from "@/components/ReelsFeedLive"
import Navigation from "@/components/navigation"

export default function ReelsPage() {
  // 一時停止中: Reels の実装はコメントアウトしています
  return (
    <>
      {/* <ReelsFeedLive /> */}
      <div className="h-[100vh] flex items-center justify-center text-gray-500">
        <div className="text-center space-y-2">
          <p>動画フィードは現在メンテナンス中です。</p>
          <p>検索ページから動画をご覧ください。</p>
        </div>
      </div>
      <Navigation />
    </>
  )
}
