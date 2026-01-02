"use client"

import { useState } from "react"
import type { FilterOptions } from "@/lib/types"

export function useFilters() {
  const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({
    形態: [],
    価格帯: [],
    時間帯: [],
    距離: [],
    趣味・嗜好: [],
  })
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null)

  const handleFilterToggle = (category: string, option: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option],
    }))
  }

  const getSelectedCount = (category: string | null) => {
    if (!category) return 0
    return selectedFilters[category]?.length ?? 0
  }

  const getTotalSelectedCount = () => {
    return Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0)
  }

  const clearAllFilters = () => {
    setSelectedFilters({
      形態: [],
      価格帯: [],
      時間帯: [],
      距離: [],
      趣味・嗜好: [],
    })
  }

  return {
    selectedFilters,
    selectedFilterCategory,
    setSelectedFilterCategory,
    handleFilterToggle,
    getSelectedCount,
    getTotalSelectedCount,
    clearAllFilters,
  }
}


