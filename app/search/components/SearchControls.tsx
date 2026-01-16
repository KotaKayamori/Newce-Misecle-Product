"use client"

import { SearchHeader } from "./SearchHeader"
import { CategoryTabs } from "./CategoryTabs"

interface SearchControlsProps {
  isSearchMode: boolean
  didSearch: boolean
  searchTerm: string
  searchLoading: boolean
  categories: string[]
  selectedCategory: string
  popularKeywordsSets: string[]
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onSearchModeChange: (mode: boolean) => void
  onSelectCategory: (category: string) => void
  onPopularKeywordsRefresh: () => void
  onKeywordSelect: (keyword: string) => void
  onClearSearch: () => void
}

export function SearchControls({
  isSearchMode,
  didSearch,
  searchTerm,
  searchLoading,
  categories,
  selectedCategory,
  popularKeywordsSets,
  onSearchChange,
  onSearchSubmit,
  onSearchModeChange,
  onSelectCategory,
  onPopularKeywordsRefresh,
  onKeywordSelect,
  onClearSearch,
}: SearchControlsProps) {
  return (
    <div className="top-0 z-30 bg-white">
      <SearchHeader
        isSearchMode={isSearchMode}
        didSearch={didSearch}
        searchTerm={searchTerm}
        searchLoading={searchLoading}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        onSearchModeChange={onSearchModeChange}
        onClearSearch={onClearSearch}
        popularKeywordsSets={popularKeywordsSets}
        onPopularKeywordsRefresh={onPopularKeywordsRefresh}
        onKeywordSelect={onKeywordSelect}
      />

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        isSearchMode={isSearchMode}
      />
    </div>
  )
}
