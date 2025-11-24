"use client"

import { X } from "lucide-react"

interface SearchHistoryProps {
  isSearchMode: boolean
  popularKeywordsSet: number
  popularKeywordsSets: string[][]
  onPopularKeywordsRefresh: () => void
  onKeywordSelect: (keyword: string) => void
}

export function SearchHistory({
  isSearchMode,
  popularKeywordsSet,
  popularKeywordsSets,
  onPopularKeywordsRefresh,
  onKeywordSelect,
}: SearchHistoryProps) {
  if (!isSearchMode) return null

  return (
    <div className="bg-white relative z-10">
      <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide bg-white px-6 py-4">
        {/* Search History */}
        {/* <div className="bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black">検索履歴</h3>
            <button
              onClick={() => {
                if (confirm("検索履歴を削除しますか？")) {
                  alert("検索履歴を削除しました")
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition"
            >
              削除する
            </button>
          </div>
          <div className="space-y-1 bg-white">
            {["焼肉", "イタリアン 渋谷", "カフェ 新宿", "ラーメン", "寿司 銀座"].map((history, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-1 hover:bg-gray-50 transition bg-white"
              >
                <span className="text-black text-sm">{history}</span>
                <button className="text-black hover:text-gray-600 transition">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div> */}

        {/* Popular Genres/Keywords */}
        <div className="bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black">人気のジャンル・キーワード</h3>
            <button
              onClick={onPopularKeywordsRefresh}
              className="text-sm text-blue-600 hover:text-blue-700 transition"
            >
              更新する
            </button>
          </div>
          <div className="flex flex-wrap gap-2 bg-white">
            {popularKeywordsSets[popularKeywordsSet].map((genre, index) => (
              <button
                key={index}
                onClick={() => onKeywordSelect(genre)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


