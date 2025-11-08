"use client"

interface CategoryTabsProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  isSearchMode: boolean
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
  isSearchMode,
}: CategoryTabsProps) {
  if (isSearchMode) return null

  return (
    <div className="mb-4">
      <div className="flex overflow-x-auto scrollbar-hide pb-2 gap-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              selectedCategory === category ? "text-black" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {category}
            {selectedCategory === category && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}


