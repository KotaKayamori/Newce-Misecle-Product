"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { SearchHistory } from "./SearchHistory"

interface SearchHeaderProps {
  isSearchMode: boolean
  didSearch: boolean
  searchTerm: string
  searchLoading: boolean
  onSearchChange: (term: string) => void
  onSearchSubmit: () => void
  onSearchModeChange: (mode: boolean) => void
  onClearSearch: () => void
  popularKeywordsSet: number
  popularKeywordsSets: string[][]
  onPopularKeywordsRefresh: () => void
  onKeywordSelect: (keyword: string) => void
}

export function SearchHeader({
  isSearchMode,
  didSearch,
  searchTerm,
  searchLoading,
  onSearchChange,
  onSearchSubmit,
  onSearchModeChange,
  onClearSearch,
  popularKeywordsSet,
  popularKeywordsSets,
  onPopularKeywordsRefresh,
  onKeywordSelect,
}: SearchHeaderProps) {
  const handleCloseModal = () => {
    if (!searchTerm.trim()) {
      onClearSearch()
    } else {
      onSearchModeChange(false)
    }
  }

  // ★ クライアント側だけでランダムセットに差し替えるためのローカル state
  const [displaySetIndex, setDisplaySetIndex] = useState(popularKeywordsSet)

  useEffect(() => {
    // マウント後に一度だけランダム選択
    if (popularKeywordsSets.length > 0) {
      const randomIndex = Math.floor(Math.random() * popularKeywordsSets.length)
      setDisplaySetIndex(randomIndex)
    }
  }, [popularKeywordsSets.length])

  return (
    <div className="bg-white px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1" onClick={() => onSearchModeChange(true)}>
          <div className="relative rounded-full border border-black p-[3px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4 pointer-events-none" />
              <Input
                readOnly
                value={searchTerm}
                placeholder="検索ワードを入力"
                className="pl-10 rounded-full border border-black text-black placeholder:text-gray-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            if (searchTerm.trim()) onSearchSubmit()
            else onSearchModeChange(true)
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          disabled={searchLoading}
        >
          検索
        </Button>
      </div>

      {/* 検索バー直下の人気キーワード */}
      <div className="mt-1">
        <div className="flex flex-wrap gap-2">
          {popularKeywordsSets[displaySetIndex]?.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onKeywordSelect(keyword)}
              className="px-3 py-1 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <Search className="w-3 h-3 text-gray-500" />
              <span>{keyword}</span>
            </button>
          ))}
        </div>
      </div>

      {isSearchMode && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-x-0 top-0 h-1/2 bg-white z-50 rounded-b-3xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">検索</h2>
              <Button variant="ghost" onClick={handleCloseModal} className="text-black">
                閉じる
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
                <Input
                  placeholder="検索ワードを入力"
                  className="pl-10 rounded-full border-black text-black placeholder:text-gray-400"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearchSubmit()
                  }}
                />
              </div>
              <Button
                onClick={onSearchSubmit}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={!searchTerm.trim() || searchLoading}
              >
                検索
              </Button>
            </div>
            {didSearch && <p className="text-sm text-gray-500">現在の検索結果を表示中です</p>}

            <div className="flex-1 overflow-y-auto">
              <SearchHistory
                isSearchMode
                popularKeywordsSet={popularKeywordsSet}
                popularKeywordsSets={popularKeywordsSets}
                onPopularKeywordsRefresh={onPopularKeywordsRefresh}
                onKeywordSelect={(keyword) => {
                  onKeywordSelect(keyword)
                  onSearchModeChange(false)
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}