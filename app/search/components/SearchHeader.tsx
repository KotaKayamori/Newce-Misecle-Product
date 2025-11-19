"use client"

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
  return (
    <div className="bg-white px-6 py-4">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex-1 relative cursor-pointer"
          onClick={() => onSearchModeChange(true)}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
          <div className="pl-10 pr-4 py-2 border border-black rounded-full bg-white text-gray-600">
            {searchTerm.trim() ? searchTerm : "店舗名・ジャンル・キーワードで検索"}
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
                  placeholder="店舗名・ジャンル・キーワードで検索"
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
