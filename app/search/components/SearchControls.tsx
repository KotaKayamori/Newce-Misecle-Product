"use client"

import { SearchHeader } from "./SearchHeader"
import { CategoryTabs } from "./CategoryTabs"
import { SearchHistory } from "./SearchHistory"

interface SearchControlsProps {
  isSearchMode: boolean
  didSearch: boolean
  searchTerm: string
  searchLoading: boolean
  categories: string[]
  selectedCategory: string
  popularKeywordsSet: number
  popularKeywordsSets: string[][]
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onSearchModeChange: (mode: boolean) => void
  onSelectCategory: (category: string) => void
  onPopularKeywordsRefresh: () => void
  onKeywordSelect: (keyword: string) => void
}

export function SearchControls({
  isSearchMode,
  didSearch,
  searchTerm,
  searchLoading,
  categories,
  selectedCategory,
  popularKeywordsSet,
  popularKeywordsSets,
  onSearchChange,
  onSearchSubmit,
  onSearchModeChange,
  onSelectCategory,
  onPopularKeywordsRefresh,
  onKeywordSelect,
}: SearchControlsProps) {
  return (
    <div className="bg-white">
      <SearchHeader
        isSearchMode={isSearchMode}
        didSearch={didSearch}
        searchTerm={searchTerm}
        searchLoading={searchLoading}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        onSearchModeChange={onSearchModeChange}
      />

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        isSearchMode={isSearchMode}
      />

      <SearchHistory
        isSearchMode={isSearchMode}
        popularKeywordsSet={popularKeywordsSet}
        popularKeywordsSets={popularKeywordsSets}
        onPopularKeywordsRefresh={onPopularKeywordsRefresh}
        onKeywordSelect={onKeywordSelect}
      />
    </div>
  )
}
