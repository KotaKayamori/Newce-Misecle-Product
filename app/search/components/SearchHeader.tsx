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
  popularKeywordsSets: string[]
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
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1" onClick={() => onSearchModeChange(true)}>
          <div className="relative rounded-full border border-black">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                readOnly
                value={searchTerm}
                placeholder="食べたいものを入れてみて"
                className="h-12 pl-10 rounded-full border-none text-black placeholder:text-black cursor-pointer"
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
      <div className="mt-1 -mx-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3">
          <div className="flex gap-2 whitespace-nowrap">
            {popularKeywordsSets?.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => onKeywordSelect(keyword)}
                className="px-2 py-1.5 text-xs rounded-full border border-gray-300 bg-white text-black hover:bg-gray-50 flex items-center gap-1 flex-shrink-0"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>{keyword}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {isSearchMode && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-x-0 top-0 h-full bg-white z-50 rounded-b-3xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">検索</h2>
              <Button variant="ghost" onClick={handleCloseModal} className="text-black">
                閉じる
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="検索ワードを入力"
                  className="h-12 pl-10 rounded-full border-none bg-gray-200 text-black placeholder:text-gray-400 focus:border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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