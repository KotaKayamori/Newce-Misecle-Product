"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchHeaderProps {
  isSearchMode: boolean
  didSearch: boolean
  searchTerm: string
  searchLoading: boolean
  onSearchChange: (term: string) => void
  onSearchSubmit: () => void
  onSearchModeChange: (mode: boolean) => void
}

export function SearchHeader({
  isSearchMode,
  didSearch,
  searchTerm,
  searchLoading,
  onSearchChange,
  onSearchSubmit,
  onSearchModeChange,
}: SearchHeaderProps) {
  return (
    <div className="bg-white px-6 py-4">
      {(isSearchMode || didSearch) ? (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
            <Input
              placeholder="店舗名・ジャンル・キーワードで検索"
              className="pl-10 rounded-full border-black text-black placeholder:text-gray-400"
              autoFocus={isSearchMode}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearchSubmit() }}
            />
          </div>
          <Button 
            onClick={onSearchSubmit} 
            className="bg-orange-600 hover:bg-orange-700 text-white" 
            disabled={!searchTerm.trim() || searchLoading}
          >
            検索
          </Button>
          {isSearchMode && (
            <Button 
              variant="ghost" 
              onClick={() => onSearchModeChange(false)} 
              className="text-black hover:text-gray-800"
            >
              キャンセル
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4">
          <div onClick={() => onSearchModeChange(true)} className="flex-1 relative cursor-pointer">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
            <div className="pl-10 pr-4 py-2 border border-black rounded-full bg-white text-gray-400">
              店舗名・ジャンル・キーワードで検索
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


